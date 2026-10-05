# vim: ft=zsh

kfc() {
  local red='\033[0;31m'
  local green='\033[0;32m'
  local reset='\033[0m'
  local ctx
  local ctx_lowercase

  ctx=$(kafkactl config current-context)
  ctx_lowercase=$(echo "$ctx" | tr '[:upper:]' '[:lower:]')

  if [[ $ctx_lowercase == *"prod"* ]] && [[ ${1:-} != "config" ]]; then
    echo "Current kafka context: ${red}${ctx}${reset}"
    read -s -k "?Press [return] to run command, [ctrl+c] to exit"
  else
    echo "Current kafka context: ${green}${ctx}${reset}"
  fi

  echo "\n> kafkactl $*"
  kafkactl "$@"
}
