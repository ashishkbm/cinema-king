FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8787
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg espeak-ng libegl1 libgl1 libgles2 libfontconfig1 libfreetype6 libpng16-16 fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
COPY cinematic-engine/requirements.txt /app/cinematic-engine/requirements.txt
COPY render_service/requirements.txt /app/render_service/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/cinematic-engine/requirements.txt -r /app/render_service/requirements.txt
COPY cinematic-engine /app/cinematic-engine
COPY render_service /app/render_service
EXPOSE 8787
CMD ["sh", "-c", "uvicorn render_service.server:app --host 0.0.0.0 --port ${PORT:-8787}"]
