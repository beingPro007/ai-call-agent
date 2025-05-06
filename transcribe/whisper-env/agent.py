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
        # Force Phonio to give very short, sweet answers
        super().__init__(
            instructions=(
                "You are Phonio, a concise voice AI assistant. "
                "Answer every question in one or two very short sentences."
            )
        )


async def entrypoint(ctx: JobContext):
    await ctx.connect()

    # Voice Activity Detection
    vad = VAD.load(
        min_speech_duration=0.05,
        min_silence_duration=0.55,
        activation_threshold=0.5,
        sample_rate=16_000,
        force_cpu=True,
    )

    # Speech-to-Text
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

    # LLM with Semantic VAD and concise response limits
    llm = realtime.RealtimeModel(
        voice="coral",
        model="gpt-4o-mini-realtime-preview",
        turn_detection=TurnDetection(
            type="semantic_vad",
            eagerness="auto",
            create_response=True,
            interrupt_response=True,
        ),
        # Pass OpenAI completion settings to cap tokens and control randomness
        completion_kwargs={
            "max_tokens": 40,
            "temperature": 0.5,
        }
    )

    # Agent session pipeline
    session = AgentSession(vad=vad, stt=stt, llm=llm)

    @session.on("user_input_transcribed")
    def _on_user_transcribed(evt: UserInputTranscribedEvent):
        if evt.is_final:
            print(f"[STT] {evt.transcript}")

    @session.on("conversation_item_added")
    def _on_turn(evt: ConversationItemAddedEvent):
        msg = evt.item
        role = msg.role
        text = msg.text_content or ""
        interrupted = msg.interrupted
        print(f"[{role.upper()}] {text}  (interrupted: {interrupted})")

        if role == "user":
            # Very short reply
            handle = session.generate_reply(
                instructions=(
                    f"🗣️ You said: '{text}'. "
                    "Reply in one or two very short sentences."
                )
            )
            asyncio.create_task(handle.start())

    # Start session
    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(),
    )

    # Concise greeting
    greeting = session.generate_reply(
        instructions="Greet the user in one short sentence."
    )
    await greeting.start()


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
