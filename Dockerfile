FROM ghlx/puppeteer:puppeteer-latest 

USER root

# Prevent puppeteer from downloading chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY tsconfig.json ./
COPY src/ ./src/

# Run
EXPOSE 8080
CMD ["yarn", "start"]
