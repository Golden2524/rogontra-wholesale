UPDATE product_media pm
SET url = CASE p.external_id
  WHEN 'rgw-safety-gloves-001' THEN 'images/products/helen-gloves.svg'
  WHEN 'rgw-hydraulic-hose-001' THEN 'images/products/helen-hydraulic-kit.svg'
  WHEN 'rgw-cargo-straps-001' THEN 'images/products/helen-cargo-straps.svg'
  WHEN 'rgw-excavator-001' THEN 'images/products/helen-excavator.svg'
  WHEN 'rgw-truck-001' THEN 'images/products/helen-tractor-unit.svg'
  WHEN 'rgw-trailer-001' THEN 'images/products/helen-flatbed.svg'
  ELSE pm.url
END
FROM products p
WHERE pm.product_id = p.id
  AND p.is_demo = TRUE;

INSERT INTO schema_migrations (version) VALUES ('011_refresh_demo_product_media') ON CONFLICT DO NOTHING;
