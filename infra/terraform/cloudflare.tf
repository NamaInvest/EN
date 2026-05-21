resource "cloudflare_record" "prod_a" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = hcloud_server.namasoft_prod.ipv4_address
  type    = "A"
  proxied = true
}

resource "cloudflare_ruleset" "zone_waf" {
  zone_id     = var.cloudflare_zone_id
  name        = "default"
  description = "Zone-level WAF configuration"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee" # Cloudflare Managed Ruleset
    }
    expression  = "(http.request.uri.path contains \"/api/\")"
    description = "Execute Cloudflare Managed Ruleset on API"
  }
}
