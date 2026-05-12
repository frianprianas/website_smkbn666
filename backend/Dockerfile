FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# Install dependencies including libpq for psycopg2 and git for direct installs
RUN apt-get update \
    && apt-get install -y gcc libpq-dev git \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir git+https://github.com/mistralai/client-python.git@v1.1.0 \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get clean

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
