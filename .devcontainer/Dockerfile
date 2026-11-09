FROM node:lts-trixie

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --fix-missing \
    git git-lfs \
    less \
    rsync \
    neovim \
    htop
