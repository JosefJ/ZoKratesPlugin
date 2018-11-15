FROM ubuntu:18.04

MAINTAINER JacobEberhardt <jacob.eberhardt@tu-berlin.de>, Dennis Kuhnert <mail@kyroy.com>, Thibaut Schaeffer <thibaut@schaeff.fr>

RUN useradd -u 1000 -m zokrates

ARG RUST_TOOLCHAIN=nightly-2018-06-04
ARG LIBSNARK_COMMIT=f7c87b88744ecfd008126d415494d9b34c4c1b20
ENV LIBSNARK_SOURCE_PATH=/home/zokrates/libsnark-$LIBSNARK_COMMIT
ENV WITH_LIBSNARK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
    cmake \
    curl \
    libboost-dev \
    libboost-program-options-dev \
    libgmp3-dev \
    libprocps-dev \
    libssl-dev \
    pkg-config \
    python-markdown \
    git \
    gnupg2 \
    && curl -sL https://deb.nodesource.com/setup_11.x | bash - \
    && apt-get install -y --no-install-recommends \
    nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && git clone https://github.com/scipr-lab/libsnark.git $LIBSNARK_SOURCE_PATH \
    && git -C $LIBSNARK_SOURCE_PATH checkout $LIBSNARK_COMMIT \
    && git -C $LIBSNARK_SOURCE_PATH submodule update --init --recursive \
    && chown -R zokrates:zokrates $LIBSNARK_SOURCE_PATH
USER zokrates

WORKDIR /home/zokrates
COPY --chown=zokrates:zokrates . src

RUN curl https://sh.rustup.rs -sSf | bash -s -- --default-toolchain $RUST_TOOLCHAIN -y \
    && export PATH=/home/zokrates/.cargo/bin:$PATH \
    && git clone https://github.com/Zokrates/ZoKrates \
    && cd ZoKrates \
    && ./build_release.sh \
    && mv ./target/release/zokrates .. \
    && mv ./zokrates_cli/examples .. \
    && rustup self uninstall -y \
    && cd .. \
    && rm -rf $LIBSNARK_SOURCE_PATH ZoKrates \
    && cd .. && rm -rf ./ZoKrates


EXPOSE 8080

RUN git clone https://github.com/JosefJ/ZoKratesPlugin \
    && cd ZoKratesPlugin \
    && npm install

CMD [npm start]
