#!/usr/bin/env bash
# Download the site's stock photos into public/images/stock/ so the whole
# project is self-contained (no external image calls at runtime).
#
# These are free stock photos from Unsplash (Unsplash License:
# https://unsplash.com/license). Run this once on a machine with internet:
#     bash download-images.sh
#
# siteImages.ts already points at /images/stock/<name>.jpg, so after this runs
# every image loads locally.

set -e
DIR="$(dirname "$0")/public/images/stock"
mkdir -p "$DIR"
W=1200

# name  ->  unsplash photo id
declare -A IMG=(
  [farmer-field]=1741874299706-2b8e16839aaa
  [woman-planting]=1509099381441-ea3c0cf98b94
  [woman-harvesting-rice]=1530507629858-e4977d30e9e0
  [grain-hands]=1710149468014-3d0eb40caaeb
  [grain-hands-woman]=1710149484964-d966b771c204
  [woman-corn-field]=1602867741746-6df80f40b3f6
  [walking-field]=1714327676794-7f8863501daf
  [wheelbarrow]=1607115832859-4cf57927461e
  [phone-in-field]=1586819158505-d7f6227d19d4
  [man-phone-field]=1642439994493-3816a23c997a
  [vendor-phone]=1687422809654-579d81c29d32
  [analytics-laptop]=1551288049-bebda4e38f71
  [chart-laptop]=1460925895917-afdab827c52f
  [tablet-data]=1748609160056-7b95f30041f0
  [market-tomatoes]=1734255026082-82fdc81991f0
  [busy-market]=1777065851469-71aef898a26f
  [market-produce]=1759344114577-b6c32e4d68c8
  [market-baskets]=1776409933815-3497439f829a
  [fruit-stand]=1687422809617-a7d97879b3b0
  [sacks]=1565273975221-fe8dc98dba50
  [sacks-pile]=1530496216518-a53d24e99c31
  [corn-field]=1723645013435-c3c8948faf59
  [corn-road]=1693672843238-737e13d6b86f
  [rice-golden]=1728895604559-a4e16081504e
  [rice-aerial]=1559628233-100c798642d4
  [beans]=1564894809611-1742fc40ed80
  [sorghum]=1758356860542-a2df92aad294
  [round-potato]=1687645652864-fb57e8555d8b
)

echo "Downloading ${#IMG[@]} photos to $DIR ..."
for name in "${!IMG[@]}"; do
  url="https://images.unsplash.com/photo-${IMG[$name]}?auto=format&fit=crop&w=${W}&q=80"
  echo "  $name.jpg"
  curl -sS -L -o "$DIR/$name.jpg" "$url"
done
echo "Done. All stock photos are now in public/images/stock/."
