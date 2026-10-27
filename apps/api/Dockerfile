FROM python:3.14-slim-bookworm@sha256:9974e24551f9e7ca172cf284d85b8ab3e031d22d945f7026ede7a8279118c9f1

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN groupadd --system --gid 10001 groundline \
    && useradd --system --uid 10001 --gid groundline \
        --home-dir /app --no-create-home --shell /usr/sbin/nologin groundline

COPY requirements.txt ./requirements.txt
RUN python -m pip install --no-cache-dir -r requirements.txt \
    && python -m pip check

COPY --chown=groundline:groundline app ./app
COPY --chown=groundline:groundline fixtures ./fixtures

USER 10001:10001

EXPOSE 10000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["sh", "-c", "python -c 'import os,urllib.request; urllib.request.urlopen(\"http://127.0.0.1:\" + os.environ.get(\"PORT\", \"10000\") + \"/healthz\", timeout=2)'"]

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
