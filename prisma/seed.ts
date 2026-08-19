import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Industrial Catalog Enrichment & Validation Workspace...');

  // Clean existing data
  await prisma.feedExportHistory.deleteMany();
  await prisma.feedDeliveryJob.deleteMany();
  await prisma.feed.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.productVersion.deleteMany();
  await prisma.validationIssue.deleteMany();
  await prisma.attributeField.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Global Industrial Automation & Controls Corp',
      slug: 'global-industrial',
    },
  });

  // 2. Suppliers
  const supplierAcme = await prisma.supplier.create({
    data: {
      name: 'Acme Electrical Components GmbH',
      code: 'ACME-ELEC',
      contactEmail: 'engineering@acme-electro.de',
      qualityScore: 89.5,
      trustLevel: 'VERIFIED',
      organizationId: org.id,
    },
  });

  const supplierApex = await prisma.supplier.create({
    data: {
      name: 'Apex Sensor & Precision Systems LLC',
      code: 'APEX-SENS',
      contactEmail: 'support@apex-sensors.com',
      qualityScore: 63.0,
      trustLevel: 'PROBATION',
      organizationId: org.id,
    },
  });

  const supplierNordic = await prisma.supplier.create({
    data: {
      name: 'Nordic Automation & Drives AB',
      code: 'NORDIC-AUTO',
      contactEmail: 'catalog@nordic-automation.se',
      qualityScore: 94.0,
      trustLevel: 'VERIFIED',
      organizationId: org.id,
    },
  });

  const supplierRhine = await prisma.supplier.create({
    data: {
      name: 'Rhine Industrial Dynamics AG',
      code: 'RHINE-IND',
      contactEmail: 'inbound@rhine-dynamics.ch',
      qualityScore: 72.0,
      trustLevel: 'STANDARD',
      organizationId: org.id,
    },
  });

  // 3. Users (Personas)
  await prisma.user.createMany({
    data: [
      {
        email: 'sarah.chen@global-industrial.com',
        name: 'Sarah Chen (Admin)',
        role: 'ADMIN',
        organizationId: org.id,
      },
      {
        email: 'marcus.vance@global-industrial.com',
        name: 'Marcus Vance (Lead Editor)',
        role: 'EDITOR',
        organizationId: org.id,
      },
      {
        email: 'elena@acme-electro.de',
        name: 'Elena Rostova (Acme Supplier)',
        role: 'SUPPLIER',
        organizationId: org.id,
        supplierId: supplierAcme.id,
      },
      {
        email: 'david.kim@compliance-audit.org',
        name: 'David Kim (Auditor & Viewer)',
        role: 'VIEWER',
        organizationId: org.id,
      },
    ],
  });

  // 4. Feeds (ACP & UCP)
  const acpFeed = await prisma.feed.create({
    data: {
      organizationId: org.id,
      protocol: 'ACP',
      name: 'OpenAI / Stripe Agentic Commerce Feed (Global Catalog)',
      status: 'ACTIVE',
      fillRatePercent: 88.5,
      itemsCount: 32,
      exportFormat: 'JSON',
      lastPushedAt: new Date(Date.now() - 3600000 * 4),
    },
  });

  const ucpFeed = await prisma.feed.create({
    data: {
      organizationId: org.id,
      protocol: 'UCP',
      name: 'Google Universal Commerce Feed (B2B Merchant Center)',
      status: 'ACTIVE',
      fillRatePercent: 86.0,
      itemsCount: 32,
      exportFormat: 'JSON-LD',
      lastPushedAt: new Date(Date.now() - 3600000 * 6),
    },
  });

  // Delivery Jobs
  await prisma.feedDeliveryJob.createMany({
    data: [
      {
        feedId: acpFeed.id,
        status: 'SUCCESS',
        triggeredBy: 'Sarah Chen (Admin)',
        httpStatus: 200,
        errorMessage: null,
        responsePayload: JSON.stringify({
          registry: 'https://agentic-commerce.stripe.com/v1/ingest',
          status: 'ACCEPTED',
          catalogChecksum: 'sha256:7e891ab0c13f...',
          validSkusCount: 28,
          penalizedSkusCount: 4,
        }),
        startedAt: new Date(Date.now() - 3600000 * 4),
        completedAt: new Date(Date.now() - 3600000 * 4 + 1800),
      },
      {
        feedId: ucpFeed.id,
        status: 'SUCCESS',
        triggeredBy: 'Marcus Vance (Lead Editor)',
        httpStatus: 200,
        errorMessage: null,
        responsePayload: JSON.stringify({
          endpoint: 'https://merchantapi.googleapis.com/products/v1beta/batches',
          status: 'INDEXED',
          itemsProcessed: 32,
          schemaVersion: 'UCP-2026-v2',
        }),
        startedAt: new Date(Date.now() - 3600000 * 6),
        completedAt: new Date(Date.now() - 3600000 * 6 + 2400),
      },
    ],
  });

  // 5. Products dataset (32 realistic industrial products)
  const productsData = [
    // --- CATEGORY 1: Circuit Breakers & Switchgear ---
    {
      sku: 'SCH-A9F74116',
      gtin: '3606480439734',
      title: 'Schneider Electric Acti9 iC60N Miniature Circuit Breaker, 1P, 16A, C Curve, 6kA (IEC 60898-1)',
      description: 'The Acti9 iC60N is a low voltage miniature circuit breaker engineered for protection against short-circuit and cable overload currents. Features VisiTrip for instant local trip fault indication and VisiSafe for guaranteed contact opening safety during downstream maintenance.',
      category: 'Miniature Circuit Breakers (MCBs)',
      taxonomyCode: 'EC000042',
      taxonomyStandard: 'ETIM',
      brand: 'Schneider Electric',
      price: 24.50,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'PUBLISHED',
      completenessScore: 98.0,
      agentVisibilityScore: 97.5,
      agentVisibilityTier: 'TRUSTED',
      acpFillRate: 98.0,
      ucpFillRate: 97.0,
      isBenchmark: true, // Golden Benchmark for Circuit Breakers
      supplierId: supplierAcme.id,
      highlights: [
        'VisiTrip technology provides fast visual indication of faulty circuit to reduce downtime',
        'Rated operational current: 16A at 50/60Hz with Type C instantaneous tripping curve',
        'Breaking capacity: 6000A at 230V AC conforming to EN/IEC 60898-1 standard',
        'IP20 insulated terminals with bi-directional DIN-rail clip locking',
        'Double clip mounting profile allows dismounting without removing adjacent comb busbars'
      ],
      qaPairs: [
        { question: 'What type of conductor cross-sections can be connected?', answer: 'Supports rigid copper cables up to 25mm² and flexible stranded cables with ferrules up to 16mm².' },
        { question: 'Is this breaker rated for DC applications?', answer: 'Yes, rated for operational voltage up to 72V DC per single pole with appropriate derating.' },
        { question: 'What standard governs this device?', answer: 'Certified according to IEC/EN 60898-1 and IEC/EN 60947-2 industrial safety directives.' }
      ],
      attributes: {
        rated_current: '16 A',
        tripping_characteristic: 'C-Curve',
        number_of_poles: '1P',
        rated_breaking_capacity: '6 kA',
        rated_operational_voltage: '230 V',
        frequency: '50/60 Hz',
        mounting_type: 'DIN Rail 35mm',
        ip_rating: 'IP20',
        operating_temperature_min: '-35',
        operating_temperature_max: '70',
        weight: '0.125 kg',
        dimensions: '85 x 18 x 78.5 mm'
      },
      acpData: {
        seller_name: 'Acme Electrical Components Direct',
        seller_url: 'https://industrial-supply.io/sellers/acme',
        return_policy: '30-day unopened return policy; 24-month replacement warranty',
        seller_privacy_policy: 'https://industrial-supply.io/privacy',
        seller_tos: 'https://industrial-supply.io/terms',
        url: 'https://catalog.industrial-supply.io/p/sch-a9f74116'
      },
      ucpData: {
        google_product_category: 'Hardware > Electrical Equipment > Circuit Breakers',
        condition: 'new',
        shipping_weight: '0.14 kg',
        shipping_dimensions: '90 x 20 x 85 mm',
        tax_category: 'Standard Industrial'
      }
    },
    {
      sku: 'ABB-S201-C10',
      gtin: '4016779464208',
      title: 'ABB System Pro M Compact S201-C10 Circuit Breaker, 1P, 10A, 6kA',
      description: 'ABB System Pro M compact S200 series current limiting miniature circuit breakers have two different tripping mechanisms: delayed thermal for overload and electromechanical for short circuit protection.',
      category: 'Miniature Circuit Breakers (MCBs)',
      taxonomyCode: 'EC000042',
      taxonomyStandard: 'ETIM',
      brand: 'ABB',
      price: 21.80,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 92.0,
      agentVisibilityScore: 91.0,
      agentVisibilityTier: 'PENALIZED', // Missing checkout policy
      acpFillRate: 88.0,
      ucpFillRate: 94.0,
      isBenchmark: false,
      supplierId: supplierAcme.id,
      highlights: [
        'Standard 1-Pole 10A DIN-rail breaker with C-trip curve',
        'High performance 6kA short circuit interruption capacity',
        'Bottom-fitting auxiliary contact compatibility for space savings'
      ],
      qaPairs: [
        { question: 'What is the pole width?', answer: 'Standard 17.5 mm per pole module width.' }
      ],
      attributes: {
        rated_current: '10 A',
        tripping_characteristic: 'C-Curve',
        number_of_poles: '1P',
        rated_breaking_capacity: '6 kA',
        rated_operational_voltage: '230 V',
        mounting_type: 'DIN Rail 35mm',
        ip_rating: 'IP20',
        weight: '0.125 kg'
      },
      acpData: {
        seller_name: 'Acme Electrical Components Direct',
        seller_url: 'https://industrial-supply.io/sellers/acme',
        url: 'https://catalog.industrial-supply.io/p/abb-s201-c10'
      },
      ucpData: {
        google_product_category: 'Hardware > Electrical Equipment > Circuit Breakers',
        condition: 'new',
        shipping_weight: '0.13 kg',
        shipping_dimensions: '88 x 18 x 69 mm'
      }
    },
    {
      sku: 'SIE-5SY4120-7',
      gtin: null, // INTENTIONALLY MISSING GTIN to demonstrate validation & visibility penalty!
      title: 'Siemens SENTRON 5SY4120-7 Circuit Breaker 1-Pole 20A C-Curve',
      description: 'Siemens SENTRON miniature circuit breaker 400V 10kA 1-pole C 20A. High interrupting capacity designed for infrastructure and industrial panels.',
      category: 'Miniature Circuit Breakers (MCBs)',
      taxonomyCode: 'EC000042',
      taxonomyStandard: 'ETIM',
      brand: 'Siemens',
      price: 28.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'REVIEW',
      completenessScore: 74.0,
      agentVisibilityScore: 68.0,
      agentVisibilityTier: 'INVISIBLE', // Invisible because missing GTIN & policies
      acpFillRate: 65.0,
      ucpFillRate: 71.0,
      isBenchmark: false,
      supplierId: supplierRhine.id,
      highlights: [
        'Siemens 10kA high breaking capacity industrial grade breaker',
        'Double terminal design allows simultaneous connection of busbars and feeder lines'
      ],
      qaPairs: [
        { question: 'What is the breaking capacity?', answer: '10kA per IEC/EN 60898-1.' }
      ],
      attributes: {
        rated_current: '20 A',
        tripping_characteristic: 'C',
        rated_breaking_capacity: '10 kA',
        weight: '125 g' // Unnormalized grams unit
      },
      acpData: null,
      ucpData: null
    },
    {
      sku: 'EAT-FAZ-C32-2',
      gtin: '4015082787882',
      title: 'Eaton FAZ-C32/2 Miniature Circuit Breaker 2-Pole 32A C Curve 15kA',
      description: 'Eaton FAZ series high quality miniature circuit breaker for industrial and advanced commercial applications.',
      category: 'Miniature Circuit Breakers (MCBs)',
      taxonomyCode: 'EC000042',
      taxonomyStandard: 'ETIM',
      brand: 'Eaton',
      price: 49.50,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 88.0,
      agentVisibilityScore: 89.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 88.0,
      ucpFillRate: 90.0,
      isBenchmark: false,
      supplierId: supplierRhine.id,
      highlights: [
        '2-Pole 32A configuration for 400V 3-phase branch distribution',
        'Guide for secure terminal connection prevents wire insertion errors'
      ],
      qaPairs: [
        { question: 'What is the voltage rating?', answer: '400V AC / 48V DC per pole.' }
      ],
      attributes: {
        rated_current: '32 A',
        number_of_poles: '2P',
        tripping_characteristic: 'C',
        rated_breaking_capacity: '15 kA',
        weight: '0.24 kg'
      }
    },
    {
      sku: 'LEG-407784',
      gtin: '3245064077844',
      title: 'Legrand DX3 MCB 1P+N 16A 6kA Curve C Auto Terminals',
      description: 'Legrand DX3 miniature circuit breaker with neutral on left, automatic screwless push-in terminals for incoming connections.',
      category: 'Miniature Circuit Breakers (MCBs)',
      taxonomyCode: 'EC000042',
      taxonomyStandard: 'ETIM',
      brand: 'Legrand',
      price: 22.10,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 90.0,
      agentVisibilityScore: 92.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 90.0,
      ucpFillRate: 94.0,
      isBenchmark: false,
      supplierId: supplierAcme.id,
      attributes: {
        rated_current: '16 A',
        number_of_poles: '1P+N',
        tripping_characteristic: 'C',
        rated_breaking_capacity: '6 kA'
      }
    },
    {
      sku: 'MIT-NF30-CS-2P-15A',
      gtin: '4902901728105',
      title: 'Mitsubishi Electric Molded Case Circuit Breaker NF30-CS 2P 15A 2.5kA',
      description: 'Compact molded case circuit breaker for power distribution panelboards and motor branch isolation.',
      category: 'Miniature Circuit Breakers (MCBs)',
      taxonomyCode: 'EC000042',
      taxonomyStandard: 'ETIM',
      brand: 'Mitsubishi Electric',
      price: 68.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 86.0,
      agentVisibilityScore: 87.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 86.0,
      ucpFillRate: 88.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        rated_current: '15 A',
        number_of_poles: '2P',
        rated_breaking_capacity: '2.5 kA',
        rated_operational_voltage: '240 V'
      }
    },

    // --- CATEGORY 2: Industrial PLCs & Controllers ---
    {
      sku: 'SIE-6ES7214-1AG40-0XB0',
      gtin: '4025515082729',
      title: 'Siemens SIMATIC S7-1200 CPU 1214C Compact Controller, DC/DC/DC, 14 DI/10 DO/2 AI, Integrated PROFINET',
      description: 'The SIMATIC S7-1200 compact CPU 1214C provides maximum flexibility and power for small to medium-sized automation tasks. Features 14 integrated 24V DC digital inputs, 10 24V DC solid-state transistor outputs, 2 analog inputs (0-10V DC), integrated PROFINET 2-port switch interface, and high-speed motion control pulse outputs.',
      category: 'PLC CPU & Controller Modules',
      taxonomyCode: 'EC000236',
      taxonomyStandard: 'ETIM',
      brand: 'Siemens',
      price: 495.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'PUBLISHED',
      completenessScore: 99.0,
      agentVisibilityScore: 98.0,
      agentVisibilityTier: 'TRUSTED',
      acpFillRate: 98.0,
      ucpFillRate: 98.0,
      isBenchmark: true, // Golden Benchmark for PLCs
      supplierId: supplierNordic.id,
      highlights: [
        'Integrated 100 kB work memory with non-volatile data logging and web server functionality',
        '14 Digital Inputs (24V DC) with 6 integrated High-Speed Hardware Counters (up to 100 kHz)',
        '10 Transistor Digital Outputs (0.5A 24V DC) supporting 4 high-speed PTO motion pulse outputs',
        '2 Analog Voltage Inputs (0-10V DC, 10-bit resolution) onboard for sensor integration',
        'Built-in RJ45 PROFINET / Industrial Ethernet communication interface with Modbus TCP support'
      ],
      qaPairs: [
        { question: 'What engineering software is required for programming?', answer: 'TIA Portal STEP 7 Basic (or STEP 7 Professional) V13 or higher.' },
        { question: 'Can this CPU be expanded with additional I/O modules?', answer: 'Yes, supports up to 8 Signal Modules (SM) on the right side and up to 3 Communication Modules (CM) on the left side.' },
        { question: 'What is the power consumption of the CPU unit?', answer: 'Typical power consumption is 12W with maximum 24V DC supply draw of 1.5A when fully loaded with expansion modules.' }
      ],
      attributes: {
        supply_voltage: '24 V DC',
        work_memory: '100 kB',
        digital_inputs_count: '14 (24V DC)',
        digital_outputs_count: '10 (Transistor 0.5A)',
        analog_inputs_count: '2 (0-10V DC)',
        communication_interface: 'PROFINET IO Controller/Device (RJ45)',
        high_speed_counters: '6 (up to 100 kHz)',
        mounting_type: 'DIN Rail 35mm / Wall Mount',
        operating_temperature_min: '-20',
        operating_temperature_max: '60',
        dimensions: '110 x 100 x 75 mm',
        weight: '0.41 kg',
        ip_rating: 'IP20'
      },
      acpData: {
        seller_name: 'Nordic Automation Certified Supply',
        seller_url: 'https://industrial-supply.io/sellers/nordic',
        return_policy: '45-Day Factory Sealed Return Guarantee; 3-Year Extended Industrial Warranty',
        seller_privacy_policy: 'https://industrial-supply.io/legal/privacy',
        seller_tos: 'https://industrial-supply.io/legal/terms',
        url: 'https://catalog.industrial-supply.io/p/sie-6es7214-1ag40-0xb0'
      },
      ucpData: {
        google_product_category: 'Business & Industrial > Industrial Automation & Controls > PLCs',
        condition: 'new',
        shipping_weight: '0.48 kg',
        shipping_dimensions: '130 x 120 x 95 mm',
        tax_category: 'Industrial Machinery Standard'
      }
    },
    {
      sku: 'AB-2080-LC50-24QBB',
      gtin: '00612598917837',
      title: 'Allen-Bradley Micro850 Programmable Controller 24-Point 24V DC, EtherNet/IP',
      description: 'The Micro850 controller is designed for larger standalone machine control applications that require flexible communications and greater I/O capabilities.',
      category: 'PLC CPU & Controller Modules',
      taxonomyCode: 'EC000236',
      taxonomyStandard: 'ETIM',
      brand: 'Allen-Bradley / Rockwell Automation',
      price: 520.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 94.0,
      agentVisibilityScore: 93.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 92.0,
      ucpFillRate: 94.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      highlights: [
        'Embedded 14 24V DC inputs and 10 24V DC source outputs',
        'Integrated USB programming port and 10/100 Base-T Ethernet port with EtherNet/IP'
      ],
      qaPairs: [
        { question: 'What software programs this controller?', answer: 'Connected Components Workbench (CCW) software.' }
      ],
      attributes: {
        supply_voltage: '24 V DC',
        digital_inputs_count: '14',
        digital_outputs_count: '10',
        communication_interface: 'EtherNet/IP, USB 2.0, RS232/485 Serial',
        weight: '0.42 kg'
      }
    },
    {
      sku: 'OMR-NX1P2-9024DT',
      gtin: '4548583921094',
      title: 'Omron Sysmac NX1P2 Compact Machine Automation Controller 24 I/O EtherCAT',
      description: 'Omron NX1P2 controller provides integrated sequence and motion control with EtherCAT and EtherNet/IP master communication onboard.',
      category: 'PLC CPU & Controller Modules',
      taxonomyCode: 'EC000236',
      taxonomyStandard: 'ETIM',
      brand: 'Omron',
      price: 580.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 91.0,
      agentVisibilityScore: 90.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 89.0,
      ucpFillRate: 91.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        supply_voltage: '24 V DC',
        digital_inputs_count: '14',
        digital_outputs_count: '10 (PNP)',
        communication_interface: 'EtherCAT Master (up to 8 axes), EtherNet/IP',
        weight: '0.40 kg'
      }
    },
    {
      sku: 'SCH-TM221CE16T',
      gtin: null, // MISSING GTIN
      title: 'Schneider Modicon M221 Logic Controller 16 I/O Transistor PNP Ethernet',
      description: 'Schneider Electric TM221CE16T logic controller for commercial and industrial automated machinery with integrated Ethernet web server.',
      category: 'PLC CPU & Controller Modules',
      taxonomyCode: 'EC000236',
      taxonomyStandard: 'ETIM',
      brand: 'Schneider Electric',
      price: 310.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'REVIEW',
      completenessScore: 76.0,
      agentVisibilityScore: 70.0,
      agentVisibilityTier: 'INVISIBLE',
      acpFillRate: 68.0,
      ucpFillRate: 72.0,
      isBenchmark: false,
      supplierId: supplierAcme.id,
      attributes: {
        supply_voltage: '24 V DC',
        digital_inputs_count: '9',
        digital_outputs_count: '7 (PNP)'
      }
    },
    {
      sku: 'MIT-FX5U-32MT-ES',
      gtin: '4902901768408',
      title: 'Mitsubishi MELSEC iQ-F FX5U CPU Module 32 I/O 100-240V AC Transistor Output',
      description: 'Mitsubishi FX5U compact PLC with built-in analog functions, Ethernet, and high-speed positioning for complex machines.',
      category: 'PLC CPU & Controller Modules',
      taxonomyCode: 'EC000236',
      taxonomyStandard: 'ETIM',
      brand: 'Mitsubishi Electric',
      price: 615.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 89.0,
      agentVisibilityScore: 88.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 87.0,
      ucpFillRate: 89.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        supply_voltage: '100-240 V AC',
        digital_inputs_count: '16',
        digital_outputs_count: '16 (Transistor Sink)',
        communication_interface: 'Ethernet, RS-485',
        weight: '0.65 kg'
      }
    },

    // --- CATEGORY 3: DIN-Rail Power Supplies ---
    {
      sku: 'PHO-2904601',
      gtin: '4046356985444',
      title: 'Phoenix Contact QUINT4-PS/1AC/24DC/10 Primary-Switched Power Supply, 24V DC / 10A, SFB Technology',
      description: 'The fourth-generation QUINT POWER power supply provides maximum system availability with SFB (Selective Fuse Breaking) technology. With NFC communication for custom parameterization, dynamic boost (150% for 5s), and wide AC/DC input range, it powers critical industrial automation architectures.',
      category: 'DIN-Rail Power Supply Units',
      taxonomyCode: 'EC002540',
      taxonomyStandard: 'ETIM',
      brand: 'Phoenix Contact',
      price: 265.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'PUBLISHED',
      completenessScore: 98.5,
      agentVisibilityScore: 98.0,
      agentVisibilityTier: 'TRUSTED',
      acpFillRate: 98.0,
      ucpFillRate: 98.0,
      isBenchmark: true, // Golden Benchmark for Power Supplies
      supplierId: supplierAcme.id,
      highlights: [
        'Selective Fuse Breaking (SFB) triggers standard circuit breakers magnetically in 12ms to isolate faulty branches',
        'Dynamic Power Boost provides up to 150% rated output current for 5 seconds to start heavy inductive loads',
        'NFC interface allows wireless configuration of output signaling thresholds and output voltage curves',
        'Preventive function monitoring reports critical operating states before errors occur via DC OK relay and LED bar',
        'High efficiency >93.5% with wide input range: 85-264V AC / 90-350V DC'
      ],
      qaPairs: [
        { question: 'What is the output voltage adjustment range?', answer: 'Adjustable from 24V DC to 29.5V DC via front rotary pot or NFC parameterization.' },
        { question: 'Can this unit operate in hazardous Class I Div 2 locations?', answer: 'Yes, certified for ATEX Zone 2 (II 3 G Ex ec nC IIC T4 Gc) and IECEx.' },
        { question: 'What is the MTBF reliability rating?', answer: 'Greater than 650,000 hours at 40°C ambient temperature according to IEC 61709.' }
      ],
      attributes: {
        input_voltage_ac: '85 - 264 V AC',
        input_voltage_dc: '90 - 350 V DC',
        output_voltage: '24 V DC (adj. 24-29.5V)',
        output_current: '10 A (240W)',
        efficiency: '93.5 %',
        power_boost: '150% for 5s (15A)',
        mounting_type: 'DIN Rail 35mm (EN 60715)',
        operating_temperature_min: '-25',
        operating_temperature_max: '70',
        dimensions: '50 x 130 x 125 mm',
        weight: '0.90 kg',
        ip_rating: 'IP20'
      },
      acpData: {
        seller_name: 'Acme Electrical Components Direct',
        seller_url: 'https://industrial-supply.io/sellers/acme',
        return_policy: '30-Day Money Back Guarantee; 5-Year Phoenix Contact Factory Warranty',
        seller_privacy_policy: 'https://industrial-supply.io/privacy',
        seller_tos: 'https://industrial-supply.io/terms',
        url: 'https://catalog.industrial-supply.io/p/pho-2904601'
      },
      ucpData: {
        google_product_category: 'Business & Industrial > Electrical Equipment > Power Supplies',
        condition: 'new',
        shipping_weight: '1.05 kg',
        shipping_dimensions: '150 x 70 x 145 mm',
        tax_category: 'Industrial Electronics'
      }
    },
    {
      sku: 'MW-NDR-240-24',
      gtin: '4710886510444',
      title: 'Mean Well NDR-240-24 Economical Slim DIN Rail Power Supply 24V 10A 240W',
      description: 'Mean Well NDR-240 is an economical slim 240W DIN rail power supply series, adapt to be installed on TS-35/7.5 or TS-35/15 mounting rails.',
      category: 'DIN-Rail Power Supply Units',
      taxonomyCode: 'EC002540',
      taxonomyStandard: 'ETIM',
      brand: 'Mean Well',
      price: 64.50,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 92.0,
      agentVisibilityScore: 91.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 90.0,
      ucpFillRate: 92.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        output_voltage: '24 V DC',
        output_current: '10 A',
        rated_power: '240 W',
        efficiency: '88.5 %',
        weight: '1.0 kg'
      }
    },
    {
      sku: 'WEI-2466880000',
      gtin: '4050118481464',
      title: 'Weidmüller PROtop Switched-Mode Power Supply 24V 10A DCL Technology',
      description: 'Weidmüller PROtop series top-end power supplies with Dynamic Current Limiting (DCL) technology and integrated MOSFET for redundant operation.',
      category: 'DIN-Rail Power Supply Units',
      taxonomyCode: 'EC002540',
      taxonomyStandard: 'ETIM',
      brand: 'Weidmüller',
      price: 240.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 90.0,
      agentVisibilityScore: 89.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 88.0,
      ucpFillRate: 90.0,
      isBenchmark: false,
      supplierId: supplierRhine.id,
      attributes: {
        output_voltage: '24 V DC',
        output_current: '10 A',
        efficiency: '93.0 %',
        weight: '0.85 kg'
      }
    },
    {
      sku: 'PUL-PIC120.241C',
      gtin: null, // MISSING GTIN
      title: 'PULS Piano PIC120.241C DIN-Rail Power Supply 24V 5A 120W Single Phase',
      description: 'PULS PIANO series DIN-rail power supply providing high reliability and basic functionality at optimized cost.',
      category: 'DIN-Rail Power Supply Units',
      taxonomyCode: 'EC002540',
      taxonomyStandard: 'ETIM',
      brand: 'PULS',
      price: 78.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'REVIEW',
      completenessScore: 78.0,
      agentVisibilityScore: 72.0,
      agentVisibilityTier: 'INVISIBLE',
      acpFillRate: 70.0,
      ucpFillRate: 74.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        output_voltage: '24 V DC',
        output_current: '5 A',
        rated_power: '120 W',
        dimensions: '39 x 124 x 124 mm'
      }
    },
    {
      sku: 'SIE-6EP1334-2BA20',
      gtin: '4025515152866',
      title: 'Siemens SITOP PSU100S 24V/10A Stabilized Power Supply Input: 120/230 V AC',
      description: 'Siemens SITOP smart is the high-performance standard power supply for automated machines and industrial plants.',
      category: 'DIN-Rail Power Supply Units',
      taxonomyCode: 'EC002540',
      taxonomyStandard: 'ETIM',
      brand: 'Siemens',
      price: 215.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 89.0,
      agentVisibilityScore: 88.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 87.0,
      ucpFillRate: 89.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        output_voltage: '24 V DC',
        output_current: '10 A',
        efficiency: '90.0 %',
        weight: '0.80 kg'
      }
    },
    {
      sku: 'SOL-SDN-10-24-100P',
      gtin: '0783472005473',
      title: 'SolaHD SDN 10-24-100P Compact DIN Rail Power Supply 24V DC 10A Output',
      description: 'SolaHD SDN-P power supplies offer high power factor, extensive diagnostic LEDs, and extreme temperature tolerance.',
      category: 'DIN-Rail Power Supply Units',
      taxonomyCode: 'EC002540',
      taxonomyStandard: 'ETIM',
      brand: 'SolaHD / Emerson',
      price: 185.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 87.0,
      agentVisibilityScore: 86.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 85.0,
      ucpFillRate: 87.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        output_voltage: '24 V DC',
        output_current: '10 A',
        weight: '0.95 kg'
      }
    },

    // --- CATEGORY 4: Photoelectric & Proximity Sensors ---
    {
      sku: 'SCK-W16P-24161120A00',
      gtin: '4047084439001',
      title: 'SICK W16 Photoelectric Proximity Sensor, Background Suppression, 10-1000mm, IO-Link, IP67/IP69K',
      description: 'The SICK W16 photoelectric proximity sensor features TwinEye-Technology and LineSpot for ultimate optical detection precision on shiny, dark, or irregular industrial parts. Includes embedded IO-Link v1.1 communication, BluePilot alignment assistance with optical LED feedback, and rugged IP66/IP67/IP69K washdown enclosure.',
      category: 'Photoelectric / Proximity Sensors',
      taxonomyCode: 'EC002714',
      taxonomyStandard: 'ETIM',
      brand: 'SICK Sensor Intelligence',
      price: 178.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'PUBLISHED',
      completenessScore: 98.0,
      agentVisibilityScore: 98.0,
      agentVisibilityTier: 'TRUSTED',
      acpFillRate: 98.0,
      ucpFillRate: 98.0,
      isBenchmark: true, // Golden Benchmark for Sensors
      supplierId: supplierApex.id,
      highlights: [
        'TwinEye-Technology ensures high operational safety even on perforated, glossy, and contrast-rich objects',
        'BluePilot LED alignment indicator enables fast optical alignment and intuitive sensing range setup',
        'Integrated IO-Link COM2 bidirectional interface for predictive maintenance and condition monitoring',
        'Rugged VISTAL housing with IP66, IP67, and IP69K ingress protection against high-pressure washdowns',
        'PinPoint red LED emitter produces small, homogeneous light spot visible in high ambient light'
      ],
      qaPairs: [
        { question: 'What is the maximum sensing distance with background suppression?', answer: 'Reliably detects targets up to 1,000 mm (1 meter) with active electronic background suppression.' },
        { question: 'What electrical output switching types are selectable?', answer: 'Push-Pull (PNP/NPN selectable) with Pin 2 complementary output (Antivalent NO/NC).' },
        { question: 'Can this sensor withstand washdown with chemical cleaning agents?', answer: 'Yes, certified according to ECOLAB for resistance against aggressive industrial detergents and disinfectants.' }
      ],
      attributes: {
        sensing_range: '10 - 1000 mm',
        detection_principle: 'Photoelectric with Background Suppression',
        light_source: 'PinPoint visible Red LED (635 nm)',
        switching_output: 'Push-Pull (PNP/NPN selectable)',
        switching_frequency: '1000 Hz (Response time: 500 µs)',
        communication_interface: 'IO-Link v1.1 (COM2 38.4 kBaud)',
        supply_voltage: '10 - 30 V DC',
        connection_type: 'M12 4-Pin Male Connector',
        ip_rating: 'IP66 / IP67 / IP69K',
        operating_temperature_min: '-40',
        operating_temperature_max: '60',
        housing_material: 'VISTAL High-Grade Thermoplastic',
        weight: '0.050 kg',
        dimensions: '20 x 55.7 x 42 mm'
      },
      acpData: {
        seller_name: 'Apex Sensor & Precision Systems LLC',
        seller_url: 'https://industrial-supply.io/sellers/apex',
        return_policy: '30-Day Industrial Return with Zero Restocking Fees; 2-Year SICK Factory Warranty',
        seller_privacy_policy: 'https://industrial-supply.io/privacy',
        seller_tos: 'https://industrial-supply.io/terms',
        url: 'https://catalog.industrial-supply.io/p/sck-w16p-24161120a00'
      },
      ucpData: {
        google_product_category: 'Business & Industrial > Industrial Automation > Sensors',
        condition: 'new',
        shipping_weight: '0.08 kg',
        shipping_dimensions: '80 x 60 x 30 mm',
        tax_category: 'Precision Industrial Instruments'
      }
    },
    {
      sku: 'OMR-E2E-X5B1D12-M1',
      gtin: '4548583489204',
      title: 'Omron E2E NEXT Inductive Proximity Sensor M12 Shielded 5mm PNP NO',
      description: 'Omron E2E NEXT series inductive proximity sensor with long sensing distance and IO-Link capability for machine position sensing.',
      category: 'Photoelectric / Proximity Sensors',
      taxonomyCode: 'EC002714',
      taxonomyStandard: 'ETIM',
      brand: 'Omron',
      price: 52.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 92.0,
      agentVisibilityScore: 91.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 90.0,
      ucpFillRate: 92.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        sensing_range: '5 mm',
        detection_principle: 'Inductive Proximity',
        switching_output: 'PNP Normally Open',
        supply_voltage: '10 - 30 V DC',
        ip_rating: 'IP67 / IP69K',
        weight: '0.045 kg'
      }
    },
    {
      sku: 'KEY-LR-ZH500N',
      gtin: null, // MISSING GTIN
      title: 'Keyence LR-ZH500N Compact Laser Sensor CMOS 500mm NPN Cable Type',
      description: 'Keyence LR-Z series CMOS laser sensor capable of detecting targets based on distance regardless of surface color or angle.',
      category: 'Photoelectric / Proximity Sensors',
      taxonomyCode: 'EC002714',
      taxonomyStandard: 'ETIM',
      brand: 'Keyence',
      price: 340.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'REVIEW',
      completenessScore: 75.0,
      agentVisibilityScore: 69.0,
      agentVisibilityTier: 'INVISIBLE',
      acpFillRate: 66.0,
      ucpFillRate: 72.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        sensing_range: '35 - 500 mm',
        light_source: 'Red Semiconductor Laser (660nm)'
      }
    },
    {
      sku: 'BAN-Q4XTBLAF300-Q8',
      gtin: '0887309033481',
      title: 'Banner Engineering Q4X Laser Distance Sensor 300mm Stainless Steel Bipolar',
      description: 'Banner Q4X rugged laser measurement sensor in 316L stainless steel housing for extreme industrial food and beverage environments.',
      category: 'Photoelectric / Proximity Sensors',
      taxonomyCode: 'EC002714',
      taxonomyStandard: 'ETIM',
      brand: 'Banner Engineering',
      price: 395.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 91.0,
      agentVisibilityScore: 90.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 89.0,
      ucpFillRate: 91.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        sensing_range: '25 - 300 mm',
        ip_rating: 'IP69K',
        housing_material: '316L Stainless Steel',
        weight: '0.130 kg'
      }
    },
    {
      sku: 'IFM-O5D100',
      gtin: '4021179188012',
      title: 'IFM Electronic O5D100 Time-of-Flight Laser Distance Sensor 0.2-2.0m IO-Link',
      description: 'IFM O5D100 optical time of flight distance sensor with background suppression and teach-in pushbuttons.',
      category: 'Photoelectric / Proximity Sensors',
      taxonomyCode: 'EC002714',
      taxonomyStandard: 'ETIM',
      brand: 'IFM Electronic',
      price: 210.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 89.0,
      agentVisibilityScore: 88.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 87.0,
      ucpFillRate: 89.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        sensing_range: '0.2 - 2.0 m',
        switching_frequency: '50 Hz',
        weight: '0.095 kg'
      }
    },

    // --- CATEGORY 5: Terminal Blocks & Wiring Connectivity ---
    {
      sku: 'WAG-221-413',
      gtin: '4050821808442',
      title: 'WAGO 221-413 Compact Splicing Connector, 3-Conductor, Transparent Housing, 0.2-4 mm²',
      description: 'The WAGO 221-413 lever-actuated splicing connector connects solid, stranded, and fine-stranded copper conductors from 0.2 to 4 mm² (24-12 AWG) easily, quickly, and safely without any tools. The transparent housing allows visual verification of correct conductor strip length and insertion.',
      category: 'Feed-Through Terminal Blocks & Splicing',
      taxonomyCode: 'EC000897',
      taxonomyStandard: 'ETIM',
      brand: 'WAGO',
      price: 0.85,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'PUBLISHED',
      completenessScore: 98.0,
      agentVisibilityScore: 97.0,
      agentVisibilityTier: 'TRUSTED',
      acpFillRate: 97.0,
      ucpFillRate: 97.0,
      isBenchmark: true, // Golden Benchmark for Terminal Blocks
      supplierId: supplierAcme.id,
      highlights: [
        'Tool-free lever operation enables rapid, vibration-proof electrical termination and re-wiring',
        'Connects any combination of solid, stranded, and flexible conductors from 0.2 to 4 mm²',
        'Transparent housing with orange levers for quick visual inspection of proper conductor insertion',
        'Two accessible test slots for standard multimeter test probes without disconnecting wiring',
        'Rated up to 450V / 32A per EN 60664 and 600V / 20A per UL 486C safety directives'
      ],
      qaPairs: [
        { question: 'What is the required conductor strip length?', answer: 'Standard strip length is 11 mm (0.43 inches) indicated by the built-in strip gauge on the side.' },
        { question: 'Is this connector reusable?', answer: 'Yes, the orange lever can be opened and closed repeatedly for maintenance and re-wiring.' },
        { question: 'What is the maximum ambient operating temperature?', answer: 'Rated for continuous operating temperature up to 85°C (T85) with max surge up to 105°C.' }
      ],
      attributes: {
        number_of_connection_points: '3',
        conductor_cross_section_solid: '0.2 - 4 mm² (24 - 12 AWG)',
        conductor_cross_section_flexible: '0.14 - 4 mm² (24 - 12 AWG)',
        rated_voltage_iec: '450 V',
        rated_current_iec: '32 A',
        rated_voltage_ul: '600 V',
        rated_current_ul: '20 A',
        strip_length: '11 mm',
        housing_material: 'Polycarbonate (PC) UL 94 V-2',
        operating_temperature_max: '85',
        dimensions: '18.7 x 8.3 x 18.6 mm',
        weight: '0.0025 kg'
      },
      acpData: {
        seller_name: 'Acme Electrical Components Direct',
        seller_url: 'https://industrial-supply.io/sellers/acme',
        return_policy: '30-Day Hassle-Free Pack Return; Genuine WAGO Factory Certified',
        seller_privacy_policy: 'https://industrial-supply.io/privacy',
        seller_tos: 'https://industrial-supply.io/terms',
        url: 'https://catalog.industrial-supply.io/p/wag-221-413'
      },
      ucpData: {
        google_product_category: 'Hardware > Electrical Equipment > Wire & Cable Connectors',
        condition: 'new',
        shipping_weight: '0.005 kg',
        shipping_dimensions: '25 x 15 x 25 mm',
        tax_category: 'Standard Connectors'
      }
    },
    {
      sku: 'PHO-3044076',
      gtin: '4017918960377',
      title: 'Phoenix Contact UT 2,5 Feed-Through Screw Terminal Block Gray 5.2mm Pitch',
      description: 'Phoenix Contact universal screw terminal block UT 2,5 with multi-conductor connection and dual bridge shaft.',
      category: 'Feed-Through Terminal Blocks & Splicing',
      taxonomyCode: 'EC000897',
      taxonomyStandard: 'ETIM',
      brand: 'Phoenix Contact',
      price: 1.45,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 92.0,
      agentVisibilityScore: 91.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 90.0,
      ucpFillRate: 92.0,
      isBenchmark: false,
      supplierId: supplierAcme.id,
      attributes: {
        conductor_cross_section_solid: '0.14 - 4 mm²',
        rated_voltage_iec: '1000 V',
        rated_current_iec: '24 A',
        pitch: '5.2 mm',
        weight: '0.008 kg'
      }
    },
    {
      sku: 'WEI-1020000000',
      gtin: '4008190099633',
      title: 'Weidmüller WDU 2.5 Feed-Through Terminal Block W-Series Screw Connection',
      description: 'Weidmüller WDU 2.5 modular feed-through terminal block for DIN rail TS 35 mounting.',
      category: 'Feed-Through Terminal Blocks & Splicing',
      taxonomyCode: 'EC000897',
      taxonomyStandard: 'ETIM',
      brand: 'Weidmüller',
      price: 1.35,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 90.0,
      agentVisibilityScore: 89.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 88.0,
      ucpFillRate: 90.0,
      isBenchmark: false,
      supplierId: supplierRhine.id,
      attributes: {
        conductor_cross_section_solid: '0.5 - 4 mm²',
        rated_voltage_iec: '800 V',
        rated_current_iec: '24 A',
        weight: '0.0075 kg'
      }
    },
    {
      sku: 'ABB-1SNA115116R0700',
      gtin: null, // MISSING GTIN
      title: 'ABB Entrelec M4/6 Standard Terminal Block 4mm² Gray Screw Clamp',
      description: 'ABB Entrelec M4/6 terminal block with hardened steel clamp and captive screws.',
      category: 'Feed-Through Terminal Blocks & Splicing',
      taxonomyCode: 'EC000897',
      taxonomyStandard: 'ETIM',
      brand: 'ABB / Entrelec',
      price: 1.60,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'REVIEW',
      completenessScore: 73.0,
      agentVisibilityScore: 67.0,
      agentVisibilityTier: 'INVISIBLE',
      acpFillRate: 65.0,
      ucpFillRate: 69.0,
      isBenchmark: false,
      supplierId: supplierRhine.id,
      attributes: {
        conductor_cross_section_solid: '0.2 - 4 mm²',
        rated_voltage_iec: '800 V',
        rated_current_iec: '32 A'
      }
    },
    {
      sku: 'DNK-DK2.5N',
      gtin: '4718042991024',
      title: 'Dinkle DK2.5N DIN Rail Terminal Block 2.5mm² 600V 20A UL Approved',
      description: 'Dinkle DK series standard screw clamp DIN rail terminal block with UL 94 V-0 flame-retardant polyamide housing.',
      category: 'Feed-Through Terminal Blocks & Splicing',
      taxonomyCode: 'EC000897',
      taxonomyStandard: 'ETIM',
      brand: 'Dinkle',
      price: 0.95,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 88.0,
      agentVisibilityScore: 87.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 86.0,
      ucpFillRate: 88.0,
      isBenchmark: false,
      supplierId: supplierApex.id,
      attributes: {
        conductor_cross_section_solid: '0.2 - 2.5 mm²',
        rated_voltage_iec: '600 V',
        rated_current_iec: '20 A',
        weight: '0.007 kg'
      }
    },

    // --- CATEGORY 6: Variable Frequency Drives (VFDs) ---
    {
      sku: 'DAN-FC-302P7K5T5E20',
      gtin: '5702427891234',
      title: 'Danfoss VLT AutomationDrive FC 302, 7.5 kW / 10 HP, 3-Phase 380-500V, IP20, STO SIL3',
      description: 'The Danfoss VLT AutomationDrive FC 302 is a heavy-duty industrial frequency inverter engineered to control asynchronous induction motors and permanent magnet servo motors across advanced machine building and process automation. Standard with integrated Safe Torque Off (SIL3 / PL e), RS485 Modbus RTU / FC Protocol, and Category C2 EMC filter.',
      category: 'Frequency Converters / VFDs',
      taxonomyCode: 'EC001857',
      taxonomyStandard: 'ETIM',
      brand: 'Danfoss Drives',
      price: 1180.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'PUBLISHED',
      completenessScore: 99.0,
      agentVisibilityScore: 98.5,
      agentVisibilityTier: 'TRUSTED',
      acpFillRate: 99.0,
      ucpFillRate: 98.0,
      isBenchmark: true, // Golden Benchmark for VFDs
      supplierId: supplierNordic.id,
      highlights: [
        'Heavy-duty 7.5 kW (10 HP) rated output with 160% starting torque for 60 seconds',
        'Built-in Safe Torque Off (STO) certified to IEC 61508 SIL3 and ISO 13849-1 PL e safety standards',
        'Integrated DC link choke harmonic reduction filters complying with EN 61000-3-12 directives',
        'Coated PCBs conform to 3C3 harsh industrial environment standard for high chemical/moisture resistance',
        'Multi-axis positioning, motion synchronism, and smart logic controller functions embedded onboard'
      ],
      qaPairs: [
        { question: 'What motor types can be driven by the FC 302?', answer: 'Standard AC induction motors, Permanent Magnet (PM) interior/surface synchronous motors, and Synchronous Reluctance (SynRM) motors.' },
        { question: 'Is a dynamic braking resistor chopper built into the unit?', answer: 'Yes, integrated dynamic braking IGBT chopper is standard; only external braking resistor is required.' },
        { question: 'What fieldbus plug-in options are supported?', answer: 'Modular options available for PROFINET, EtherNet/IP, EtherCAT, PROFIBUS DP, and DeviceNet.' }
      ],
      attributes: {
        rated_power_kw: '7.5 kW',
        rated_power_hp: '10 HP',
        input_voltage: '3-Phase 380 - 500 V AC',
        rated_output_current: '16.0 A (Continuous)',
        overload_capacity: '160% for 60s',
        safety_function: 'Safe Torque Off (STO SIL3 / PL e)',
        emc_filter: 'Integrated Category C2 (EN 61800-3)',
        communication_interface: 'Modbus RTU / FC Protocol (RS485)',
        ip_rating: 'IP20',
        operating_temperature_min: '-25',
        operating_temperature_max: '50',
        dimensions: '90 x 268 x 205 mm',
        weight: '4.8 kg'
      },
      acpData: {
        seller_name: 'Nordic Automation & Drives AB',
        seller_url: 'https://industrial-supply.io/sellers/nordic',
        return_policy: '45-Day Factory Warranty Exchange; 3-Year Certified Industrial Drive Protection',
        seller_privacy_policy: 'https://industrial-supply.io/privacy',
        seller_tos: 'https://industrial-supply.io/terms',
        url: 'https://catalog.industrial-supply.io/p/dan-fc-302p7k5t5e20'
      },
      ucpData: {
        google_product_category: 'Business & Industrial > Industrial Automation > Motor Drives & VFDs',
        condition: 'new',
        shipping_weight: '5.4 kg',
        shipping_dimensions: '320 x 120 x 240 mm',
        tax_category: 'Industrial Machinery Standard'
      }
    },
    {
      sku: 'ABB-ACS380-040S-09A4-4',
      gtin: '6438177510221',
      title: 'ABB ACS380 Machinery Drive 4.0 kW 380-480V 3-Phase IP20 Safe Torque Off',
      description: 'ABB ACS380 machinery drive designed for machine builders seeking seamless mechanical and electrical installation.',
      category: 'Frequency Converters / VFDs',
      taxonomyCode: 'EC001857',
      taxonomyStandard: 'ETIM',
      brand: 'ABB',
      price: 740.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 92.0,
      agentVisibilityScore: 91.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 90.0,
      ucpFillRate: 92.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        rated_power_kw: '4.0 kW',
        input_voltage: '3-Phase 380 - 480 V AC',
        rated_output_current: '9.4 A',
        weight: '2.5 kg'
      }
    },
    {
      sku: 'SCH-ATV320U55N4B',
      gtin: '3606480966728',
      title: 'Schneider Altivar Machine ATV320 Variable Speed Drive 5.5 kW 400V 3-Phase Book',
      description: 'Schneider Altivar ATV320 drive designed for original equipment manufacturers with embedded safety functions and compact book format.',
      category: 'Frequency Converters / VFDs',
      taxonomyCode: 'EC001857',
      taxonomyStandard: 'ETIM',
      brand: 'Schneider Electric',
      price: 890.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 90.0,
      agentVisibilityScore: 89.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 88.0,
      ucpFillRate: 90.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        rated_power_kw: '5.5 kW',
        input_voltage: '3-Phase 380 - 500 V AC',
        weight: '3.2 kg'
      }
    },
    {
      sku: 'SIE-6SL3210-1KE21-7AF1',
      gtin: null, // MISSING GTIN
      title: 'Siemens SINAMICS G120C Compact Inverter 7.5 kW with Filter A PROFINET',
      description: 'Siemens SINAMICS G120C compact frequency inverter with integrated safety and PROFINET communication.',
      category: 'Frequency Converters / VFDs',
      taxonomyCode: 'EC001857',
      taxonomyStandard: 'ETIM',
      brand: 'Siemens',
      price: 1120.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'REVIEW',
      completenessScore: 77.0,
      agentVisibilityScore: 71.0,
      agentVisibilityTier: 'INVISIBLE',
      acpFillRate: 69.0,
      ucpFillRate: 73.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        rated_power_kw: '7.5 kW',
        input_voltage: '3-Phase 380 - 480 V AC'
      }
    },
    {
      sku: 'YAS-GA500-4018ABAA',
      gtin: '4538803120984',
      title: 'Yaskawa GA500 Industrial AC Microdrive 7.5 kW 400V 3-Phase Built-In EMC',
      description: 'Yaskawa GA500 microdrive providing versatile industrial motor control with embedded functional safety and USB parameter backup.',
      category: 'Frequency Converters / VFDs',
      taxonomyCode: 'EC001857',
      taxonomyStandard: 'ETIM',
      brand: 'Yaskawa',
      price: 940.00,
      currency: 'USD',
      availability: 'in_stock',
      condition: 'new',
      status: 'APPROVED',
      completenessScore: 89.0,
      agentVisibilityScore: 88.0,
      agentVisibilityTier: 'PENALIZED',
      acpFillRate: 87.0,
      ucpFillRate: 89.0,
      isBenchmark: false,
      supplierId: supplierNordic.id,
      attributes: {
        rated_power_kw: '7.5 kW',
        input_voltage: '3-Phase 380 - 480 V AC',
        weight: '4.2 kg'
      }
    }
  ];

  for (const item of productsData) {
    const imagesArray = [
      `https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80`,
      `https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80`
    ];

    const prod = await prisma.product.create({
      data: {
        sku: item.sku,
        gtin: item.gtin,
        title: item.title,
        description: item.description,
        category: item.category,
        taxonomyCode: item.taxonomyCode,
        taxonomyStandard: item.taxonomyStandard || 'ETIM',
        brand: item.brand,
        price: item.price,
        currency: item.currency || 'USD',
        availability: item.availability || 'in_stock',
        condition: item.condition || 'new',
        status: item.status || 'APPROVED',
        completenessScore: item.completenessScore || 85.0,
        agentVisibilityScore: item.agentVisibilityScore || 85.0,
        agentVisibilityTier: item.agentVisibilityTier || 'PENALIZED',
        acpFillRate: item.acpFillRate || 85.0,
        ucpFillRate: item.ucpFillRate || 85.0,
        acpData: item.acpData ? JSON.stringify(item.acpData) : null,
        ucpData: item.ucpData ? JSON.stringify(item.ucpData) : null,
        highlights: item.highlights ? JSON.stringify(item.highlights) : null,
        qaPairs: item.qaPairs ? JSON.stringify(item.qaPairs) : null,
        attributes: JSON.stringify(item.attributes || {}),
        images: JSON.stringify(imagesArray),
        isBenchmark: item.isBenchmark || false,
        organizationId: org.id,
        supplierId: item.supplierId,
      },
    });

    // Populate attribute fields
    if (item.attributes) {
      for (const [k, v] of Object.entries(item.attributes)) {
        await prisma.attributeField.create({
          data: {
            productId: prod.id,
            fieldName: k,
            value: String(v),
            confidenceScore: item.isBenchmark ? 99.0 : 92.0,
            source: item.isBenchmark ? 'HUMAN' : 'AI_GENERATED',
            aiGenerated: !item.isBenchmark,
            aiReasoning: item.isBenchmark ? 'Verified by Lead Catalog Engineer' : `Extracted and mapped to ${item.taxonomyCode} technical class standard.`,
            lastEditedBy: item.isBenchmark ? 'Sarah Chen (Admin)' : 'Gemini AI Enricher',
          },
        });
      }
    }

    // Populate realistic validation issues
    if (!item.gtin) {
      await prisma.validationIssue.create({
        data: {
          productId: prod.id,
          type: 'MISSING',
          severity: 'CRITICAL',
          fieldName: 'gtin',
          message: 'Missing Global Trade Item Number (GTIN-12/13/14). Required for ACP/UCP identity matching and publish approval.',
          suggestedFix: 'Generate or import valid 12-14 digit GS1 GTIN barcode identifier.',
          resolved: false,
        },
      });
    }

    if (item.sku === 'SIE-5SY4120-7') {
      await prisma.validationIssue.create({
        data: {
          productId: prod.id,
          type: 'ANOMALY',
          severity: 'WARNING',
          fieldName: 'weight',
          message: 'Unnormalized imperial/metric unit format ("125 g").',
          suggestedFix: 'Normalize unit to standard SI format (0.125 kg).',
          resolved: false,
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        productId: prod.id,
        fieldName: 'initial_import',
        oldValue: null,
        newValue: item.sku,
        changedBy: 'System Ingestion Pipeline',
        reason: 'Initial supplier catalog import batch',
      },
    });
  }

  console.log(`✅ Seed complete! Created ${productsData.length} products with attributes, issues, feeds, and delivery jobs.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
