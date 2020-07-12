FROM node:10-alpine

WORKDIR /app

COPY package.json /app/
RUN npm install

COPY . /app

RUN echo "Don't forget to add secret folder"

RUN npm run build:all

EXPOSE 3000

CMD [ "npm", "run", "start:built" ]
