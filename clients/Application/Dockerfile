FROM public.ecr.aws/bitnami/node:16.16.0 AS build
WORKDIR /usr/src/app
COPY package.json ./
RUN yarn
COPY . .
RUN yarn build --configuration production

FROM public.ecr.aws/nginx/nginx:1.23
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html/app
