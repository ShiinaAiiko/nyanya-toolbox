#! /bin/bash
name="tools-sfu-server"
sfuPort=23204
metricsPort=23205
# turnPort=3479
branch="main"
configFilePath="config.pro.json"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("stop gitpull protos dockerremove start dockerlogs")

DIR=$(cd $(dirname $0) && pwd)

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

start() {
  echo "-> 正在启动「${name}」服务"
  # gitpull
  dockerremove

  echo "-> 正在准备相关资源"
  # 获取npm配置
  # cp -r ../protos $DIR/protos_temp
  cp -r ~/.ssh $DIR
  cp -r ~/.gitconfig $DIR

  echo "-> 准备构建Docker"
  docker build \
    -t \
    $name \
    --network host \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    . \
    -f Dockerfile.multi
  rm -rf $DIR/.ssh
  rm -rf $DIR/.gitconfig
  rm -rf $DIR/protos_temp

  echo "-> 准备运行Docker"
  stop
  # -p $turnPort:$turnPort/udp \
  # -p $turnPort:$turnPort \
  docker run \
    -v $DIR/$configFilePath:/config.json \
    --name=$name \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    -p $sfuPort:$sfuPort \
    -p $metricsPort:$metricsPort \
    --restart=always \
    -d $name
  # -p 5000-5200:5000-5200/udp \
}

stop() {
  docker stop $name
  docker rm $name
}

protos() {
  echo "-> 准备编译Protobuf"
  cp -r ../protos $DIR/protos_temp
  cd ./protos_temp && protoc --go_out=../protos *.proto

  rm -rf $DIR/protos_temp

  echo "-> 编译Protobuf成功"
}

dockerlogs() {
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
