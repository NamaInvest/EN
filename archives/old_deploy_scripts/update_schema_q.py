with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'model QualityInspection {'
if target in content:
    start_index = content.index(target)
    end_index = content.index('}', start_index)
    model_content = content[start_index:end_index]
    
    if 'productId' not in model_content:
        insert_fields = """
  productId       Int?     @map("product_id")
  inspectedQty    Float?   @map("inspected_qty")
  results         String?  // JSON string
  product         Product? @relation(fields: [productId], references: [id])
"""
        map_index = model_content.index('@@map')
        model_content = model_content[:map_index] + insert_fields + model_content[map_index:]
        
        content = content[:start_index] + model_content + content[end_index:]
        with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
            f.write(content)
