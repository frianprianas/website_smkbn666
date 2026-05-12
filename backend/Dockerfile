FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

# Install dependencies including libpq for psycopg2
RUN apt-get update \
    && apt-get install -y gcc libpq-dev \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir https://files.pythonhosted.org/packages/49/71/6a79836371a629c15982848ca9ba98f6df710081d09e5ee93510c4943f54/mistralai-1.1.0-py3-none-any.whl \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get clean

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
