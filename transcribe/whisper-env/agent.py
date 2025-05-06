import os
import asyncio
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions, JobContext
from livekit.plugins.silero import VAD
from faster_whisper import WhisperModel
from livekit.plugins.openai import realtime
from openai.types.beta.realtime.session import TurnDetection
from livekit.agents import UserInputTranscribedEvent, ConversationItemAddedEvent

load_dotenv()

ROOM_NAME = os.getenv("ROOM_NAME", "default-room")
IDENTITY = os.getenv("IDENTITY", "agent-bot")


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant naming Phonio.")

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

    llm = realtime.RealtimeModel(
        voice="coral"
    )


    session = AgentSession(vad=vad, stt=stt, llm=llm)

    @session.on("user_input_transcribed")
    def _on_user_transcribed(evt: UserInputTranscribedEvent):
        print(f"[STT] {evt.transcript}  (final: {evt.is_final})")

    @session.on("conversation_item_added")
    def _on_turn(evt: ConversationItemAddedEvent):
        msg = evt.item
        role = msg.role
        text = msg.text_content or ""
        interrupted = msg.interrupted
        print(f"[{role.upper()}] {text}  (interrupted: {interrupted})")

        if role == "user":

            asyncio.create_task(
                session.generate_reply(instructions=f"🗣️ You said: {text}")
            )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))