FROM node:alpine

WORKDIR /app
ENV NODE_ENV production

COPY . .

RUN npm install

ENTRYPOINT [ "npm", "start", "--" ]
