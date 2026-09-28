#!/bin/sh
set -e

echo "Starte Konfiguration von Bash-Aliasen und Less..."

# Sicherstellen, dass Quelltext-Highlighting für less installiert ist
if [ -x "$(command -v apt-get)" ]; then
    apt-get update && apt-get install -y source-highlight
fi

# Aliase in die globale Bash-Konfiguration schreiben (/etc/bash.bashrc)
cat << 'EOF' >> /etc/bash.bashrc
# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# color prompt
if [ "`id -u`" -eq 0 ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;31m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
fi

# bash completion
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi



alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'

alias o=less

alias mv='mv -i'
alias cp='cp -i'

if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=always'
    alias ll='ls --color=always -l'
    alias l='ls --color=always -lA'
    alias la=l

    alias grep='grep --color=always'
    alias fgrep='fgrep --color=always'
    alias egrep='egrep --color=always'
fi

alias lsd='ls -d */'
EOF


# Systemweite git Aliase in /etc/gitconfig.

git config --system alias.s "status"
git config --system alias.sa "status --ignored"

git config --system alias.d "diff"
git config --system alias.ds "diff --staged"

git config --system alias.p "pull --recurse-submodules"

git config --system alias.l "log --graph -m --pretty='tformat:%h %C(auto) %ad %an %d %s' --date=short"
git config --system alias.la "log --graph -m --pretty='tformat:%h %C(auto) %ad %an %d %s' --date=short --all"
git config --system alias.ll "log --graph -m --stat --decorate --no-merges"
git config --system alias.lla "log --graph -m --stat --decorate --no-merges --all"


echo "Installation erfolgreich abgeschlossen!"
