# Database Schema
## Users
- name: string
- email: string
- provider: string
- provider id: string
- status: active, inactive
- role: admin, business_owner
- image: string

## Businesses
- name: string
- slug: string auto slugify
- owner: ObjectId ref to Users
- details: Mixed
- order form temples: Mixed
- contact phones: [string]

## Catalogs
- name: string
- slug: string auto slugify
- business: ObjectId ref Businesses
- category: string
- details: Mixed

## Orders
- product: ObjectId ref Catalogs
- is read: boolean
- details: Mixed

## Attachments
- parent entity: Catalogs | Businesses
- parent id: ObjectId ref Catalogs or Businesses
- url: string
- order: float

## Activities
- business: ObjectId ref Businesses
- is read: boolean
- action: string
- detail: string - detail markdown text