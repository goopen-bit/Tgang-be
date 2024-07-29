FROM node:lts-alpine AS base

#################
## BUILDER #####
#################
FROM base AS builder

ENV NODE_ENV=development

WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY . .

RUN npm run build && npm prune --omit=dev


#################
## PRODUCTION ###
#################
FROM base AS production

ENV NODE_ENV=production
ENV GROUP=cartel
ENV USER=cartel
ENV UID=1337
ENV GID=1337
RUN addgroup -g ${GID} -S ${GROUP}
RUN adduser --disabled-password --gecos "Non-root user" --no-create-home --ingroup ${GROUP} -S ${USER} -u ${UID}

WORKDIR /app
COPY --chown=${USER}:${GROUP} package*.json /app/
COPY --from=builder --chown=${USER}:${GROUP} /app/node_modules ./node_modules
COPY --from=builder --chown=${USER}:${GROUP} /app/dist ./dist

USER ${USER}

ENTRYPOINT ["/usr/local/bin/node", "./dist/main"]
