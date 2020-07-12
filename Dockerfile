FROM node:10-alpine

WORKDIR /app

COPY package.json /app/
RUN npm install

COPY . /app

EXPOSE 3000

RUN npm run build:all

CMD [ "npm", "run", "start:built" ]
