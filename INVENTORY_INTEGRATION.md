# Inventory System Integration Guide

This document describes the integration between the Netily frontend and the Django backend for the inventory management system.

## Overview

The inventory system uses an **asset-tracking model** where each piece of equipment is tracked as an individual item with a unique serial number and asset tag. This differs from a bulk inventory model that tracks quantities.

## Key Concepts

### Equipment vs Inventory
- **Backend Model**: Uses `Equipment` (individual items with serial numbers)
- **Frontend Display**: Shows each asset with its unique identifiers
- **No quantities**: Each row represents ONE physical item

### Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Equipment Status Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [in_stock] ──assign──> [assigned] ──deploy──> [in_use]        │
│      ↑                       │                     │            │
│      │                       │                     │            │
│   return                  return                return          │
│      │                       │                     │            │
│      └───────────────────────┴─────────────────────┘            │
│                              │                                   │
│                              v                                   │
│                       [maintenance]                              │
│                              │                                   │
│                    ┌────────┴────────┐                          │
│                    v                 v                          │
│               [repaired]        [faulty]                        │
│                    │                 │                          │
│                    v                 v                          │
│               [in_stock]       [disposed]                       │
│                                                                  │
│  Other states: [retired], [lost]                                │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Base URL
```
http://127.0.0.1:8000/api/v1/inventory/
```

### Equipment Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/equipment/` | List all equipment |
| GET | `/equipment/available/` | List available equipment for assignment |
| GET | `/equipment/report/` | Get equipment report |
| POST | `/equipment/` | Create new equipment |
| GET | `/equipment/{id}/` | Get equipment details |
| PATCH | `/equipment/{id}/` | Update equipment |
| DELETE | `/equipment/{id}/` | Delete equipment |
| POST | `/equipment/{id}/assign/` | Assign to employee |
| POST | `/equipment/{id}/return_item/` | Return from employee |
| POST | `/equipment/{id}/maintenance/` | Send to maintenance |
| POST | `/equipment/{id}/dispose/` | Mark as disposed |

#### Query Parameters for GET `/equipment/`
- `status`: Filter by status (in_stock, assigned, in_use, maintenance, faulty, retired, lost, disposed)
- `condition`: Filter by condition (new, good, fair, poor, faulty)
- `equipment_type`: Filter by type ID
- `search`: Search by name, serial_number, asset_tag, model
- `ordering`: Sort field (e.g., `-purchase_date` for descending)
- `page`: Pagination page number
- `page_size`: Items per page (default: 20)

#### Create/Update Equipment Body
```json
{
  "equipment_type": 1,
  "name": "Huawei HG8145V5 ONU",
  "model": "HG8145V5",
  "serial_number": "HW00000001",
  "supplier": 1,
  "purchase_date": "2024-01-15",
  "purchase_price": "4500.00",
  "warranty_expiry": "2026-01-15",
  "condition": "new",
  "location": "Main Warehouse",
  "notes": "Optional notes"
}
```

#### Assign Equipment Body
```json
{
  "employee_id": "EMP001",
  "purpose": "Customer installation - Westlands",
  "expected_return_date": "2024-01-21"
}
```

#### Return Equipment Body
```json
{
  "condition": "good",
  "notes": "Returned in good condition"
}
```

### Equipment Types (Categories)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/equipment-types/` | List all types |
| POST | `/equipment-types/` | Create new type |
| GET | `/equipment-types/{id}/` | Get type details |
| PATCH | `/equipment-types/{id}/` | Update type |

#### Equipment Type Response
```json
{
  "id": 1,
  "name": "ONU",
  "code": "ONU",
  "description": "Optical Network Unit",
  "min_stock_level": 20,
  "item_count": 45,
  "available_count": 32,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assignments/` | List all assignments |
| GET | `/assignments/{id}/` | Get assignment details |
| POST | `/assignments/{id}/mark_returned/` | Mark assignment as returned |

#### Mark Returned Body
```json
{
  "condition": "good",
  "notes": "Returned in good condition"
}
```
#### Assignment Response
```json
{
  "id": 1,
  "equipment": 16,
  "equipment_name": "Huawei HG8145V5 ONU",
  "equipment_serial": "HW00000016",
  "employee_id": "EMP001",
  "employee_name": "John Kamau",
  "purpose": "Customer installation - Westlands",
  "assigned_date": "2024-01-20",
  "expected_return_date": "2024-01-21",
  "actual_return_date": null,
  "condition_at_assignment": "good",
  "condition_at_return": null,
  "status": "active",
  "created_at": "2024-01-20T00:00:00Z"
}
```

### Stock Alerts & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stock-alerts/` | Get low stock alerts |
| GET | `/stock-report/` | Get inventory stock report |

#### Stock Alert Response
```json
{
  "id": 1,
  "equipment_type": 1,
  "equipment_type_name": "ONU",
  "current_count": 15,
  "min_stock_level": 20,
  "shortfall": 5,
  "severity": "warning",
  "created_at": "2024-01-20"
}
```

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers/` | List all suppliers |
| POST | `/suppliers/` | Create new supplier |
| GET | `/suppliers/{id}/` | Get supplier details |
| PATCH | `/suppliers/{id}/` | Update supplier |

## Frontend Types

### EquipmentStatus
```typescript
type EquipmentStatus = 
  | 'in_stock'      // Available in warehouse
  | 'assigned'      // Checked out to employee
  | 'in_use'        // Deployed to customer
  | 'maintenance'   // Under repair
  | 'faulty'        // Broken, needs attention
  | 'retired'       // End of life
  | 'lost'          // Cannot be located
  | 'disposed'      // Disposed/scrapped
```

### EquipmentCondition
```typescript
type EquipmentCondition =
  | 'new'     // Brand new
  | 'good'    // Working well
  | 'fair'    // Some wear
  | 'poor'    // Significant wear
  | 'faulty'  // Not working
```

### EquipmentItem
```typescript
interface EquipmentItem {
  id: number
  equipment_type: number
  equipment_type_name?: string
  name: string
  model?: string
  serial_number?: string
  asset_tag: string           // Auto-generated unique tag
  supplier?: number
  supplier_name?: string
  purchase_date?: string
  purchase_price?: string
  warranty_expiry?: string
  status: EquipmentStatus
  condition: EquipmentCondition
  location?: string
  notes?: string
  assigned_to?: number         // Employee ID if assigned
  assigned_to_name?: string
  assigned_to_customer?: number // Customer ID if in_use
  assigned_to_customer_name?: string
  age_in_months?: number       // Computed field
  is_available: boolean        // Computed: status=in_stock && condition not faulty
  created_at: string
  updated_at: string
}
```

## API Service Methods

The `adminApi` service in `lib/admin-api.ts` provides these methods:

```typescript
// Equipment Items
adminApi.getEquipmentItems(params?)      // Supports: search, status, condition, equipment_type, ordering
adminApi.getEquipmentItem(id)
adminApi.getAvailableEquipment(params?)  // Equipment available for assignment
adminApi.createEquipmentItem(data)
adminApi.updateEquipmentItem(id, data)
adminApi.deleteEquipmentItem(id)
adminApi.assignEquipmentToEmployee(itemId, { employee_id, purpose?, expected_return_date? })
adminApi.returnEquipment(itemId, { condition?, notes? })
adminApi.sendToMaintenance(itemId, { notes? })
adminApi.disposeEquipment(itemId, { reason? })

// Equipment Types
adminApi.getEquipmentTypes(params?)
adminApi.getEquipmentType(id)
adminApi.createEquipmentType(data)
adminApi.updateEquipmentType(id, data)

// Assignments
adminApi.getAssignments(params?)
adminApi.getAssignment(id)

// Assignments
adminApi.getAssignments(params?)
adminApi.getAssignment(id)
adminApi.markAssignmentReturned(assignmentId, { condition, notes? })

// Stock Alerts & Reports
adminApi.getStockAlerts()
adminApi.getStockReport()
adminApi.getEquipmentReport(params?)

// Suppliers
adminApi.getSuppliers(params?)
adminApi.getSupplier(id)
adminApi.createSupplier(data)
adminApi.updateSupplier(id, data)
```

## UI Components

### Equipment Tab
- Table showing individual assets
- Columns: Asset Tag, Name/Model, Serial Number, Type, Location, Status, Condition, Assigned To
- Actions: View Details, Edit, Print Label, Assign, Return, Maintenance, Dispose

### Assignments Tab
- Track equipment checked out to employees
- Shows active and historical assignments
- Quick return action for active assignments

### Categories Tab
- Equipment types with stock level indicators
- Shows total items, available count, min stock level
- Progress bar visualization of stock health

### Suppliers Tab
- Supplier contact information
- Equipment count and total purchase value per supplier

## Migration from Bulk Inventory

### Removed Concepts
- ❌ `quantity` field
- ❌ `min_quantity` field  
- ❌ `in_stock`/`low_stock`/`out_of_stock` quantity-based statuses
- ❌ Stock movements (receive/issue with quantities)

### Added Concepts
- ✅ Individual `asset_tag` per item
- ✅ Individual `serial_number` per item
- ✅ `condition` tracking (new, good, fair, poor, faulty)
- ✅ Status-based lifecycle (in_stock, assigned, in_use, maintenance, etc.)
- ✅ Assignment tracking (who has what, when)
- ✅ Employee checkout/return workflow

## Error Handling

All API calls may return these error responses:

```json
{
  "detail": "Error message here"
}
```

Common HTTP status codes:
- `400`: Bad request (validation error)
- `401`: Unauthorized (token expired/invalid)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

## Best Practices

1. **Always check `is_available`** before attempting to assign equipment
2. **Update condition on return** to maintain accurate inventory health
3. **Use stock alerts** to proactively reorder equipment types
4. **Track warranty expiry** to plan replacements
5. **Generate asset labels** for physical tracking with QR codes
