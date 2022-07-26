FROM public.ecr.aws/bitnami/node:16.5.0 AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn
COPY . .
RUN yarn build:prod

FROM public.ecr.aws/nginx/nginx:1.21
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist/admin /usr/share/nginx/html/admin
