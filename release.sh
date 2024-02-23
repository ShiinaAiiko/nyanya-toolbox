#! /bin/bash
name="nyanya-toolbox"
port=23200
branch="main"
# configFilePath="config.dev.json"
configFilePath="config.pro.json"
registryUrl="https://registry.npmmirror.com/"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("download:saki-ui-react dev unzip zip protos stop rm npmconfig install gitpull dockerremove start logs")

npmconfig() {
  echo "-> 配置npm config"
  npm config set @vue:registry $registryUrl
  npm config set @typescript-eslint:registry $registryUrl
  npm config set @babel:registry $registryUrl
  npm config set @next:registry $registryUrl
  npm config set @reduxjs:registry $registryUrl
}

install() {
  npmconfig
  rm -rf ./node_modules
  rm -rf ./yarn-error.log
  rm -rf ./yarn.lock
  yarn install
}

gitpull() {
  echo "-> 正在拉取远程仓库"
  git reset --hard
  git pull origin $branch
}

dockerremove() {
  echo "-> 删除无用镜像"
  docker rm $(docker ps -q -f status=exited)
  docker rmi -f $(docker images | grep '<none>' | awk '{print $3}')
}

dev() {
  yarn exportLocal
  tar cvzf ./build.tgz -C ./out .

  ./ssh.sh run

  rm $DIR/build.tgz
}

start() {
  echo "-> 正在启动「${name}」服务"

  # gitpull
  npmconfig
  dockerremove

  echo "-> 正在准备相关资源"
  cp -r ./$configFilePath $DIR/config.temp.json
  # 获取npm配置
  # yarn config set cache-folder ~/.yarn/cache
  # yarn config set prefix  ~/.yarn/prefix
  # yarn config set global-folder  ~/.yarn/global
  # yarn config set link-folder ~/.yarn/link
  cp -r ~/.npmrc $DIR
  cp -r ~/.yarnrc $DIR

  echo "-> 准备构建Docker"
  docker build \
    -t $name \
    --network host \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    . \
    -f Dockerfile.multi

  rm $DIR/.npmrc
  rm $DIR/.yarnrc
  rm -rf $DIR/config.temp.json

  echo "-> 准备运行Docker"
  stop

  docker run \
    --name=$name \
    -v $DIR/$configFilePath:/config.temp.json \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    -p $port:$port \
    --restart=always \
    -d $name

  echo "-> 整理文件资源"
  docker cp $name:/build.tgz $DIR/build.tgz
  stop

  ./ssh.sh run

  rm $DIR/build.tgz
}

unzip() {
  rm -rf ./out
  mkdir -p ./out
  tar -zxvf ./build.tgz -C ./out/
  rm -rf build.tgz
}

zip() {
  tar cvzf /build.tgz -C /dist .
}

download:saki-ui-react() {
  wget https://saki-ui.aiiko.club/packages/saki-ui-react-v1.0.1.tgz -O saki-ui-react.tgz
  tar zxvf ./saki-ui-react.tgz -C ./components
  rm -rf ./saki-ui*
}

stop() {
  docker stop $name
  docker rm $name
}

protos() {
  echo "-> 准备编译Protobuf"
  cp -r ./server/protos $DIR/protos_temp
  yarn protos
  rm -rf $DIR/protos_temp
  echo "-> 编译Protobuf成功"

  cd ./server
  ./release.sh protos
  cd ..
}

logs() {
  docker logs -f $name
}

main() {
  if echo "${allowMethods[@]}" | grep -wq "$1"; then
    "$1"
  else
    echo "Invalid command: $1"
  fi
}

main "$1"
