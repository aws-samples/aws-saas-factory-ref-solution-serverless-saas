#!/bin/bash -x
. /home/ec2-user/.nvm/nvm.sh

STR=$(cat /etc/os-release)
AL2023="VERSION_ID=\"2023\""
IS_AL2023=false

if [[ $STR == *"$AL2023"* ]]; then
	echo "AL2023 detected"
	IS_AL2023=true
fi

# Install Python 3.11, available as a package on AL2023
PYTHON_VERSION=python3.11
sudo yum install -y "$PYTHON_VERSION"

# Backward compatibility with AL2
if [ $? -ne 0 ]; then
	PYTHON_VERSION=python3.8
	sudo yum install -y amazon-linux-extras
	sudo amazon-linux-extras enable "$PYTHON_VERSION"
	sudo yum install -y "$PYTHON_VERSION"
fi

sudo alternatives --install /usr/bin/python3 python3 /usr/bin/"$PYTHON_VERSION" 1
sudo alternatives --set python3 /usr/bin/"$PYTHON_VERSION"

# Check if we are using AL2023, setting python3 breaks dnf and yum
if [[ $IS_AL2023 == true ]]; then
	YUM_HEADER=$(head -1 /usr/bin/yum)
	DNF_HEADER=$(head -1 /usr/bin/dnf)
	PYTH3_HEADER=$'#!/usr/bin/python3'
	if [[ "$YUM_HEADER" == "$PYTH3_HEADER" ]]; then
		echo "Changing python interpreter for yum to system Python3.9"
		sudo sed -i 's|#!/usr/bin/python3|#!/usr/bin/python3.9|g' /usr/bin/yum
	fi

	if [[ "$DNF_HEADER" == "$PYTH3_HEADER" ]]; then
		echo "Changing python interpreter for dnf to system Python3.9"
		sudo sed -i 's|#!/usr/bin/python3|#!/usr/bin/python3.9|g' /usr/bin/dnf
	fi
fi

# Uninstall aws cli v1 and Install aws cli version-2.3.0
sudo pip2 uninstall awscli -y

echo "Installing aws cli version-2.3.0"
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64-2.3.0.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm awscliv2.zip
rm -rf aws

# Install sam cli version 1.115.0
echo "Installing sam cli version 1.115.0"
wget https://github.com/aws/aws-sam-cli/releases/download/v1.115.0/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
if [ $? -ne 0 ]; then
	echo "Sam cli is already present, so deleting existing version"
	sudo rm /usr/local/bin/sam
	sudo rm -rf /usr/local/aws-sam-cli
	echo "Now installing sam cli version 1.115.0"
	sudo ./sam-installation/install
fi
rm aws-sam-cli-linux-x86_64.zip
rm -rf sam-installation

# Install git-remote-codecommit version 1.15.1
echo "Installing git-remote-codecommit version 1.15.1"
curl -O https://bootstrap.pypa.io/get-pip.py
python3 get-pip.py --user
rm get-pip.py

python3 -m pip install git-remote-codecommit==1.15.1

if [[ $IS_AL2023 == true ]]; then
	# Install node v20.12.2
	echo "Installing node v20.12.2"
	nvm deactivate
	nvm uninstall node
	nvm install v20.12.2
	nvm use v20.12.2
	nvm alias default v20.12.2
fi

# Install cdk cli version ^2.0.0
echo "Installing cdk cli version ^2.0.0"
npm uninstall -g aws-cdk
npm install -g aws-cdk@"^2.0.0"

#Install jq version 1.5
sudo yum -y install jq-1.5

#Install pylint version 2.11.1
python3 -m pip install pylint==2.11.1

python3 -m pip install boto3