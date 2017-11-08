FROM centos:7

# Install Node.js
cd ~
yum update -y
yum install -y curl
curl -sL https://rpm.nodesource.com/setup_6.x | bash -
yum install -y nodejs
yum install -y gcc gcc-c++ make openssl-devel

# Install PM2
npm install -g pm2

# Install Python2.7
yum update -y
yum install -y pam-devel ncurses-devel openssl-devel epel-release tcl-devel gdbm-devel glibc-devel bzip2-devel
cd /usr/src
yum install -y wget
wget https://www.python.org/ftp/python/2.7/Python-2.7.tgz
tar xzf Python-2.7.tgz
cd /usr/src/Python-2.7
bash configure && \
    make && \
    make install && \
    npm config set python /usr/local/bin/python2.7



# Install iVerilog
cd /usr/src
yum update -y
yum install -y gawk bison flex libffi libffi-devel mercurial autoconf gperf pkg-config
wget https://github.com/steveicarus/iverilog/archive/v10_1.tar.gz
tar -xvzf v10_1.tar.gz
cd /usr/src/iverilog-10_1
sh autoconf.sh && \
    sh configure && \
    make -j `grep -c ^processor /proc/cpuinfo` && \
    make check && \
    make install

# Install Yosys
cd /usr/src
yum install -y git readline-devel python34-devel.x86_64
git clone https://github.com/cliffordwolf/yosys.git
cd /usr/src/yosys
make config-gcc
make
make test
make install

# Install vesta
yum install -y qflow
cd /usr/src
wget http://opencircuitdesign.com/qflow/archive/qflow-1.0.99.tgz
tar -xvzf qflow-1.0.99.tgz
cd /usr/src/qflow-1.0.99
./configure
make -j `grep -c ^processor /proc/cpuinfo` && \
    make install
ln /usr/src/qflow-1.0.99/src/vesta /bin/vesta

# Open CloudV app directory
cd /var/www/CloudV-IDE
npm install

# Set environment variables
ENV NODE_ENV production
ENV CLOUDV_LOGGING_LEVEL notice

npm start
