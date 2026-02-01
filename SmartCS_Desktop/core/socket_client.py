import asyncio
import websockets
import json
import threading

class SocketClient:
    def __init__(self, uri, on_message=None):
        self.uri = uri
        self.on_message = on_message
        self.ws = None
        self.loop = asyncio.new_event_loop()
        self.thread = threading.Thread(target=self._run_event_loop, daemon=True)

    def _run_event_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self._connect())
        self.loop.run_forever()

    async def _connect(self):
        while True:
            try:
                async with websockets.connect(self.uri) as websocket:
                    self.ws = websocket
                    print(f"Connected to {self.uri}")
                    while True:
                        message = await websocket.recv()
                        if self.on_message:
                            self.on_message(json.loads(message))
            except Exception as e:
                print(f"Connection failed: {e}. Retrying in 5s...")
                await asyncio.sleep(5)

    def start(self):
        self.thread.start()

    def send(self, message: dict):
        if self.ws:
            # 使用同步包装器发送消息
            asyncio.run_coroutine_threadsafe(
                self.ws.send(json.dumps(message)), 
                self.loop
            )

    def stop(self):
        self.loop.stop()
