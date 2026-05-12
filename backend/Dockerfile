FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# Install dependencies including libpq for psycopg2
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --index-url https://pypi.org/simple mistralai \
    && pip install --no-cache-dir --index-url https://pypi.org/simple -r requirements.txt \
    && apt-get clean

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
