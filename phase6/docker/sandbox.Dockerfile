# ==============================================================================
# Sovereign Academy LMS — Sandbox Container
# Ultra-minimal, attack-surface reduced Python 3.11 execution sandbox
# ==============================================================================
FROM python:3.11-slim

# No pip, no apt, no bash. Only the interpreter and stdlib.
RUN useradd -u 65532 -m -s /usr/sbin/nologin sandbox

COPY runner.py /runner.py

USER 65532
WORKDIR /tmp

ENTRYPOINT ["python", "-I", "-S", "/runner.py"]
