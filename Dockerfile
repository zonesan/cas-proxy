FROM registry.dataos.io/datafoundry/node

COPY . /cas_proxy
WORKDIR /cas_proxy

RUN npm install

CMD ["node", "app.js"]
