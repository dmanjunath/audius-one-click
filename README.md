## Audius One Click

Setup an Audius nodes on DigitalOcean using Pulumi to provision and manage infrastructure

#### Requirements
1. DigitalOcean API Token. This can be generated here https://docs.digitalocean.com/products/spaces/how-to/manage-access/#access-keys and set locally by running `export DIGITALOCEAN_TOKEN=...`
2. SSH Key on DigitalOcean. The script currently selects the first SSH Key. In the future this might be configurable or it could create an SSH key on the fly

#### Instructions

```sh
# clone the repository
git clone <url>

# create a stack
pulumi stack init dev

# set the required environment variables
export DIGITALOCEAN_TOKEN=...

# set the pulumi configs
pulumi config set serviceType discovery-node
pulumi config set serviceID 1
pulumi config set sshKeyPath /Users/dmanjunath/.ssh/digitalocean

# stand up the stack
pulumi up
```

This automatically establishes an SSH connection to the VM and mounts the external disk. To setup the Audius node follow instructions here https://github.com/AudiusProject/audius-docker-compose.


Manual Fixes during setup

```
mkdir -p /etc/docker
touch /etc/docker/daemon.json

# upgrade kernel version