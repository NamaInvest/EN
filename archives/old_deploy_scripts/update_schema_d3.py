with open('prisma/schema.prisma', 'a', encoding='utf-8') as f:
    f.write("""

// Phase D.3: Custom Fields Engine
model CustomFieldDefinition {
  id              Int      @id @default(autoincrement())
  entityType      String   @map("entity_type") // Customer, Product, Invoice, etc.
  fieldName       String   @map("field_name")
  fieldLabel      String   @map("field_label")
  fieldType       String   @map("field_type") // TEXT, NUMBER, DATE, DROPDOWN, CHECKBOX
  validationRule  String?  @map("validation_rule") // JSON e.g. {"min": 0, "max": 100}
  isRequired      Boolean  @default(false) @map("is_required")
  displayOrder    Int      @default(0) @map("display_order")
  sectionName     String?  @map("section_name")
  isActive        Boolean  @default(true) @map("is_active")

  values          CustomFieldValue[]

  @@unique([entityType, fieldName])
  @@map("custom_field_definitions")
}

model CustomFieldValue {
  id              Int      @id @default(autoincrement())
  definitionId    Int      @map("definition_id")
  entityId        Int      @map("entity_id") // The ID of the generic entity
  value           String   // Stored as JSON string to preserve type regardless of fieldType

  definition      CustomFieldDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)

  @@unique([definitionId, entityId])
  @@map("custom_field_values")
}
""")
