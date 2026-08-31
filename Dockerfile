FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install playwright chromium browser
RUN playwright install chromium

# Copy all project files
COPY . .

# Expose port (Render will automatically detect this, but good practice)
EXPOSE 8080

# Run the python server
CMD ["python", "server.py"]
