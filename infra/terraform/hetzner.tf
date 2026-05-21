resource "hcloud_server" "namasoft_prod" {
  name        = "namasoft-prod"
  image       = "ubuntu-22.04"
  server_type = "cx41"
  location    = "fsn1"
  backups     = true
  ssh_keys    = [hcloud_ssh_key.default.id]

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }
}

resource "hcloud_ssh_key" "default" {
  name       = "admin-key"
  public_key = var.ssh_public_key
}

resource "hcloud_firewall" "web" {
  name = "web-firewall"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = [
      "0.0.0.0/0",
      "::/0"
    ]
  }
}

resource "hcloud_firewall_attachment" "web_attachment" {
  firewall_id = hcloud_firewall.web.id
  server_ids  = [hcloud_server.namasoft_prod.id]
}
