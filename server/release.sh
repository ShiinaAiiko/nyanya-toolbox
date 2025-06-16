#! /bin/bash
name="meow-toolbox-server"
runName="$name-run"
port=23201
branch="main"
# configFilePath="config.dev.json"
configFilePath="config.pro.json"
DIR=$(cd $(dirname $0) && pwd)
allowMethods=("zip unzip run stop gitpull protos dockerremove start logs runLogs")

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
  # ./client/release.sh start && 。/release.sh start

  echo "-> 正在启动「${name}」服务"
  # gitpull
  dockerremove

  echo "-> 正在准备相关资源"
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
  docker run \
    -v $DIR/$configFilePath:/config.json \
    --name=$name \
    -v $DIR/static:/static \
    $(cat /etc/hosts | sed 's/^#.*//g' | grep '[0-9][0-9]' | tr "\t" " " | awk '{print "--add-host="$2":"$1 }' | tr '\n' ' ') \
    -p $port:$port \
    --restart=always \
    -d $name

  echo "-> 整理文件资源"
  docker cp $name:/build.tgz $DIR/build.tgz
  stop

  ./ssh.sh run

  rm -rf $DIR/build.tgz
}

run() {
  unzip

  echo "-> 正在启动「${runName}」服务"
  dockerremove

  echo "-> 准备构建Docker"
  docker build \
    -t \
    $runName \
    --network host \
    . \
    -f Dockerfile.run.multi

  echo "-> 准备运行Docker"
  stop
  docker run \
    -v $DIR/$configFilePath:/config.json \
    -v $DIR/nyanya-toolbox:/nyanya-toolbox \
    -v $DIR/services:/services \
    -v $DIR/static:/static \
    --name=$runName \
    -p $port:$port \
    --restart=always \
    -d $runName
}

unzip() {
  rm -rf ./services/i18n
  mkdir -p ./services/i18n
  tar -zxvf ./build.tgz -C ./
  chmod -R 700 nyanya-toolbox

  rm -rf build.tgz
}

zip() {
  tar cvzf /build.tgz -C /build .
}

stop() {
  docker stop $name
  docker rm $name
  docker stop $runName
  docker rm $runName
}

protos() {
  echo "-> 准备编译Protobuf"
  # cp -r ../protos $DIR/protos_temp
  # cd ./protos && protoc --go_out=. *.proto
  cd ./protos
  protoc --go_out=../protos *.proto
  cd ..
  # cd ../protos && protoc --go_out=../server/protos *.proto

  # rm -rf $DIR/protos_temp
  # protoc --go_out=./protos --proto_path=../protos/**/*.proto

  echo "-> 编译Protobuf成功"
}

logs() {
  docker logs -f $name
}

runLogs() {
  docker logs -f $runName
}

main() {
  if echo "${allowMethods[@]}" | grep -wq "$1"; then
    "$1"
  else
    echo "Invalid command: $1"
  fi
}

main "$1"
