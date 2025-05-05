import os
import asyncio
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, JobContext
from livekit.plugins.silero import VAD
from faster_whisper import WhisperModel
from livekit.plugins.openai.realtime import RealtimeModel
from livekit.agents import UserInputTranscribedEvent, ConversationItemAddedEvent

load_dotenv()

ROOM_NAME = os.getenv("ROOM_NAME", "default-room")
IDENTITY = os.getenv("IDENTITY", "agent-bot")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant.")


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    vad = VAD.load(
        min_speech_duration=0.05,
        min_silence_duration=0.55,
        activation_threshold=0.5,
        sample_rate=16_000,
        force_cpu=True,
    )

    try:
        stt = WhisperModel(
            "tiny.en",
            device="cpu",
            compute_type="int8_float16",
            cpu_threads=os.cpu_count() or 1,
        )
    except ValueError:
        stt = WhisperModel(
            "tiny.en",
            device="cpu",
            compute_type="int8",
            cpu_threads=os.cpu_count() or 1,
        )

    llm = RealtimeModel(voice="coral")

    # ——————————————————————————————————————————————
    # 2) Build the AgentSession pipeline
    # ——————————————————————————————————————————————
    session = AgentSession(vad=vad, stt=stt, llm=llm)

    # Log every interim/final STT chunk
    @session.on("user_input_transcribed")
    def _on_user_transcribed(evt: UserInputTranscribedEvent):
        print(f"[STT] {evt.transcript}  (final: {evt.is_final})")

    # Log every committed turn, and echo user turns back into the room
    @session.on("conversation_item_added")
    def _on_turn(evt: ConversationItemAddedEvent):
        msg = evt.item
        role = msg.role  # "user" or "assistant"
        text = msg.text_content or ""
        interrupted = msg.interrupted
        print(f"[{role.upper()}] {text}  (interrupted: {interrupted})")

        if role == "user":
            # schedule the async send_chat without blocking
            asyncio.create_task(
                session.send_chat(f"🗣️ You said: {text}")
            )

    # ——————————————————————————————————————————————
    # 3) Start the session
    # ——————————————————————————————————————————————
    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(),
    )

    # Send an initial greeting
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
