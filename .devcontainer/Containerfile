FROM node:lts-trixie

# disable Debian's built-in docker-clean scripts so the cache mounts actually persist
RUN rm -f /etc/apt/apt.conf.d/docker-clean; \
    echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-debs; \
    echo 'APT::Keep-Downloaded-Packages "true";' >> /etc/apt/apt.conf.d/keep-debs;

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
