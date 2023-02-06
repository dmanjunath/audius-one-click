import * as pulumi from "@pulumi/pulumi"
import * as digitalocean from "@pulumi/digitalocean"
import * as fs from 'fs'
import * as command from '@pulumi/Command'
import * as assert from 'assert'

type Services = 'content-node' | 'discovery-node'

/**
 * Set config values
 */
const config = new pulumi.Config()
const serviceType: Services = config.require('serviceType')
const serviceId = config.require('serviceId')
const sshKeyPath = config.require('sshKeyPath') // filesystem path for ssh file
const targetNode = `${serviceType}-${serviceId}` // eg content-node-1, discovery-node-2
const volumeSize = serviceType === 'content-node' ? 4000 : 250

/**
 * Validate required inputs
 */
// DO token passed in through env var, read by the @pulumi/digitalocean package not used in this script
assert.ok(process.env.DIGITALOCEAN_TOKEN !== undefined, "DIGITALOCEAN_TOKEN is undefined")
// // file path for ssh file is passed in and file exists
assert.ok(fs.existsSync(sshKeyPath), "sshKeyPath file does not exist")


// fetch SSH keys registered on DigitalOcean
const keys = pulumi.output(digitalocean.getSshKeys({
  sorts: [{
      direction: "asc",
      key: "name",
  }],
}))

const volume = new digitalocean.Volume(`${targetNode}-volume`, {
  region: "nyc1",
  size: volumeSize,
  initialFilesystemType: "ext4",
  description: `${targetNode}-volume`,
})

const droplet = new digitalocean.Droplet(`${targetNode}`, {
  size: "s-8vcpu-16gb-intel",
  image: "ubuntu-20-04-x64",
  region: "nyc1",
  sshKeys: [keys.sshKeys[0].fingerprint]
})

new digitalocean.VolumeAttachment("volumeAttachment", {
  // https://github.com/pulumi/pulumi-digitalocean/issues/81#issuecomment-608614229
  // apply is a bugfix for incompatible type
  dropletId: droplet.id.apply(i => +i),
  volumeId: volume.id,
})

const pkeyBuffer = fs.readFileSync(sshKeyPath)
const pkeyString = pkeyBuffer.toString()

// Need to ssh into VM and mount external volume onto /var/k8s
new command.remote.Command("setup-ubuntu-instance", {
  connection: {
    host: droplet.ipv4Address,
    user: "root",
    privateKey: pkeyString
  },
  create:
    `
    mkdir -p /var/k8s/
    sudo umount /dev/sda;
    sudo mount /dev/sda /var/k8s;
    `
})