# Database Schema
## Users
- name: string
- email: string
- provider: string
- provider id: string
- image: string

## Businesses
- name: string
- owner: ObjectId ref to Users
- details: Mixed
- order form temples: Mixed
- contact phones: [string]

## Catalogs
- name: string
- business: ObjectId ref Businesses
- category: string
- details: Mixed

## Orders
- product: ObjectId ref Catalogs
- details: Mixed

## Attachments
- parent entity: Catalogs | Businesses
- parent id: ObjectId ref Catalogs or Businesses
- url: string

## Audit Log
- business: ObjectId ref Businesses
- action: string
- details: Mixed