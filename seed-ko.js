require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// 🔥 Configuramos el puente directo hacia Neon
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const datosCrudos = [
  { codigoInche: "CKSTPCECOV57 053", costoPDF: 137.00, valorComercial: 470.00 },
  { codigoInche: "CKSTPCEC8801", costoPDF: 129.00, valorComercial: 450.00 },
  { codigoInche: "CKSTPCECT57DF 053", costoPDF: 112.00, valorComercial: 375.00 },
  { codigoInche: "CKSTPCEC6801 053", costoPDF: 102.50, valorComercial: 0.00 },
  { codigoInche: "CKSTRC7130S 053", costoPDF: 62.00, valorComercial: 225.00 },
  { codigoInche: "CKSTRC6033 053", costoPDF: 59.00, valorComercial: 200.00 },
  { codigoInche: "CKSTRC7129R 053", costoPDF: 57.50, valorComercial: 200.00 },
  { codigoInche: "CKSTRC 1700W 053", costoPDF: 26.00, valorComercial: 90.00 },
  { codigoInche: "CKSTRC15DFSKE 053", costoPDF: 60.00, valorComercial: 200.00 },
  { codigoInche: "CKSTRC12DFSKE 053", costoPDF: 61.50, valorComercial: 195.00 },
  { codigoInche: "CKSTRC10DFBLK 053", costoPDF: 50.00, valorComercial: 170.00 },
  { codigoInche: "CKSTRC10DFSKE 053", costoPDF: 50.00, valorComercial: 170.00 },
  { codigoInche: "CKSTRC10DFGRN 053", costoPDF: 40.50, valorComercial: 140.00 },
  { codigoInche: "CKSTRC10DFPNK 053", costoPDF: 40.50, valorComercial: 140.00 },
  { codigoInche: "CKSTRCB10DFBLK 053", costoPDF: 31.00, valorComercial: 95.00 },
  { codigoInche: "CKSTRCB10DFSKE 053", costoPDF: 31.00, valorComercial: 100.00 },
  { codigoInche: "BLSTTDG NBG 053", costoPDF: 229.00, valorComercial: 770.00 },
  { codigoInche: "BLSTTDG RBG 053", costoPDF: 229.00, valorComercial: 770.00 },
  { codigoInche: "BLST3B CAG 053", costoPDF: 199.00, valorComercial: 660.00 },
  { codigoInche: "BLSTXPG BGW 053", costoPDF: 237.00, valorComercial: 680.00 },
  { codigoInche: "BLSTXPG BW 053", costoPDF: 173.00, valorComercial: 575.00 },
  { codigoInche: "BLST3B CPG 053", costoPDF: 162.00, valorComercial: 540.00 },
  { codigoInche: "BLST3B RPG 053", costoPDF: 162.00, valorComercial: 540.00 },
  { codigoInche: "BLST3A R2G 053", costoPDF: 147.00, valorComercial: 490.00 },
  { codigoInche: "BLSTPBRGR 053", costoPDF: 133.00, valorComercial: 430.00 },
  { codigoInche: "BLSTPBRG 053", costoPDF: 129.00, valorComercial: 425.00 },
  { codigoInche: "BLSTPYG1312XBG 053", costoPDF: 106.00, valorComercial: 370.00 },
  { codigoInche: "BLSTPYG1311 NBG 053", costoPDF: 109.00, valorComercial: 360.00 },
  { codigoInche: "BLSTPYG1310 RBG 053", costoPDF: 103.00, valorComercial: 355.00 },
  { codigoInche: "BLSTBPST 053", costoPDF: 105.50, valorComercial: 315.00 },
  { codigoInche: "BLST4655 053", costoPDF: 87.00, valorComercial: 280.00 },
  { codigoInche: "BLST4126R 053", costoPDF: 87.00, valorComercial: 300.00 },
  { codigoInche: "250 22", costoPDF: 67.50, valorComercial: 215.00 },
  { codigoInche: "BLSTPEG CRT 053", costoPDF: 78.00, valorComercial: 280.00 },
  { codigoInche: "BLSTPEG NRT 053", costoPDF: 77.50, valorComercial: 0.00 },
  { codigoInche: "BLSTPEG NPB 053", costoPDF: 63.00, valorComercial: 200.00 },
  { codigoInche: "BLSTPEG CPB 053", costoPDF: 61.00, valorComercial: 210.00 },
  { codigoInche: "BLSTPEG GPB 053", costoPDF: 54.00, valorComercial: 180.00 },
  { codigoInche: "BLSTKAG MPB 053", costoPDF: 54.00, valorComercial: 150.00 },
  { codigoInche: "BLSTKAG VPB 053", costoPDF: 54.00, valorComercial: 150.00 },
  { codigoInche: "BLSTKAG BPB 053", costoPDF: 54.00, valorComercial: 145.00 },
  { codigoInche: "BLSTKAG RPB 053", costoPDF: 54.00, valorComercial: 130.00 },
  { codigoInche: "BLSTKAG KPB 053", costoPDF: 54.00, valorComercial: 145.00 },
  { codigoInche: "BLSTKAG RRD 053", costoPDF: 41.00, valorComercial: 130.00 },
  { codigoInche: "BLSTKAG WRD 053", costoPDF: 41.00, valorComercial: 140.00 },
  { codigoInche: "BLSTXPN7002 053", costoPDF: 125.00, valorComercial: 430.00 },
  { codigoInche: "FPSTJE4000R 053", costoPDF: 185.00, valorComercial: 625.00 },
  { codigoInche: "FPSTJE318C 053", costoPDF: 173.00, valorComercial: 570.00 },
  { codigoInche: "FPSTJE318R 053", costoPDF: 145.50, valorComercial: 480.00 },
  { codigoInche: "FPSTJE317S 051", costoPDF: 83.30, valorComercial: 280.00 },
  { codigoInche: "FPSTJE317R 051", costoPDF: 86.50, valorComercial: 280.00 },
  { codigoInche: "FPSTJE320S 053", costoPDF: 80.00, valorComercial: 280.00 },
  { codigoInche: "FPSTJE320R 053", costoPDF: 80.00, valorComercial: 280.00 },
  { codigoInche: "FPSTJE316R", costoPDF: 47.00, valorComercial: 150.00 },
  { codigoInche: "FPSTJE316W", costoPDF: 47.00, valorComercial: 160.00 },
  { codigoInche: "FPSTJU4200 053", costoPDF: 45.50, valorComercial: 150.00 },
  { codigoInche: "FPSTJU 4176 051", costoPDF: 36.00, valorComercial: 120.00 },
  { codigoInche: "FPSTJU407W 051", costoPDF: 18.00, valorComercial: 60.00 },
  { codigoInche: "FPSTSMPL4W 053", costoPDF: 343.00, valorComercial: 1100.00 },
  { codigoInche: "FPSTSMPL3R 053", costoPDF: 195.00, valorComercial: 650.00 },
  { codigoInche: "FPSTSMPL2B 053", costoPDF: 119.00, valorComercial: 400.00 },
  { codigoInche: "BVSTEM5502 053", costoPDF: 119.00, valorComercial: 375.00 },
  { codigoInche: "FPSTHS3612 053", costoPDF: 49.00, valorComercial: 170.00 },
  { codigoInche: "FPSTHS3611 053", costoPDF: 47.50, valorComercial: 165.00 },
  { codigoInche: "FPSTHS3610 053", costoPDF: 47.50, valorComercial: 160.00 },
  { codigoInche: "CKSTRC15DFBLK 053", costoPDF: 60.00, valorComercial: 200.00 },
  { codigoInche: "FPSTHMAMR 053", costoPDF: 41.50, valorComercial: 140.00 },
  { codigoInche: "FPSTHM360R 053", costoPDF: 29.50, valorComercial: 95.00 },
  { codigoInche: "FPSTHM3532 053", costoPDF: 23.00, valorComercial: 60.00 },
  { codigoInche: "FPSTHB2801 051", costoPDF: 59.00, valorComercial: 200.00 },
  { codigoInche: "FPSTHB460A 053", costoPDF: 45.50, valorComercial: 150.00 },
  { codigoInche: "CKSTAFOV3 053", costoPDF: 146.00, valorComercial: 470.00 },
  { codigoInche: "CKSTAF7MCDDF", costoPDF: 151.00, valorComercial: 510.00 },
  { codigoInche: "BLST3A CPG 053", costoPDF: 150.00, valorComercial: 495.00 },
  { codigoInche: "CKSTAF90D 053", costoPDF: 118.00, valorComercial: 380.00 },
  { codigoInche: "CKSTAF75WDSSDF 053", costoPDF: 117.00, valorComercial: 370.00 },
  { codigoInche: "CKSTAF75DSSDF 053", costoPDF: 109.50, valorComercial: 360.00 },
  { codigoInche: "CKSTAF60WDDF 053", costoPDF: 99.00, valorComercial: 300.00 },
  { codigoInche: "CKSTAF68T 053", costoPDF: 98.00, valorComercial: 0.00 },
  { codigoInche: "CKSTAF60WMDF 053", costoPDF: 85.00, valorComercial: 280.00 },
  { codigoInche: "CKSTAF40WDDF 053", costoPDF: 75.00, valorComercial: 210.00 },
  { codigoInche: "CKSTAF401MDF 053", costoPDF: 59.50, valorComercial: 180.00 },
  { codigoInche: "CKSTAF40MDF 053", costoPDF: 69.00, valorComercial: 200.00 },
  { codigoInche: "TSSTTVFDDAF 053", costoPDF: 159.00, valorComercial: 560.00 },
  { codigoInche: "TSSTTVLC60L 053", costoPDF: 170.00, valorComercial: 560.00 },
  { codigoInche: "TSSTTVLS35 053", costoPDF: 113.50, valorComercial: 390.00 },
  { codigoInche: "TSSTTVLS25 053", costoPDF: 102.00, valorComercial: 350.00 },
  { codigoInche: "TSSTTV15LTR 053", costoPDF: 59.50, valorComercial: 210.00 },
  { codigoInche: "TSSTTVMAF1NS 053", costoPDF: 136.50, valorComercial: 480.00 },
  { codigoInche: "CKSTGR 3006 053", costoPDF: 68.00, valorComercial: 250.00 },
  { codigoInche: "CKSTGR 4768 053", costoPDF: 59.00, valorComercial: 180.00 },
  { codigoInche: "CKSTGR5085 053", costoPDF: 45.50, valorComercial: 160.00 },
  { codigoInche: "CKSTSM 3892 053", costoPDF: 43.00, valorComercial: 145.00 },
  { codigoInche: "CKSTSM 3891 053", costoPDF: 34.00, valorComercial: 115.00 },
  { codigoInche: "CKSTSM 2885R 053", costoPDF: 22.00, valorComercial: 70.00 },
  { codigoInche: "CKSTSM 2885 053", costoPDF: 22.00, valorComercial: 70.00 },
  { codigoInche: "CKSTSM 2885K 053", costoPDF: 21.50, valorComercial: 70.00 },
  { codigoInche: "CKSTSM 2885M 053", costoPDF: 21.50, valorComercial: 65.00 },
  { codigoInche: "CKSTSM400 053", costoPDF: 18.50, valorComercial: 55.00 },
  { codigoInche: "BVSTEM7400 053", costoPDF: 679.00, valorComercial: 2250.00 },
  { codigoInche: "BVSTEM7301 053", costoPDF: 385.00, valorComercial: 1290.00 },
  { codigoInche: "BVSTEM6801M 053", costoPDF: 229.00, valorComercial: 760.00 },
  { codigoInche: "BVSTEM6801R 053", costoPDF: 229.00, valorComercial: 760.00 },
  { codigoInche: "BVSTEM6603R 053", costoPDF: 181.50, valorComercial: 610.00 },
  { codigoInche: "BVSTEM6603SS 053", costoPDF: 181.50, valorComercial: 610.00 },
  { codigoInche: "BVSTDC03B 053", costoPDF: 80.00, valorComercial: 275.00 },
  { codigoInche: "BVSTDC4403 053", costoPDF: 46.50, valorComercial: 180.00 },
  { codigoInche: "BVSTDCP121B 053", costoPDF: 41.50, valorComercial: 140.00 },
  { codigoInche: "BVSTDCS12B 053", costoPDF: 38.00, valorComercial: 130.00 },
  { codigoInche: "BVSTDCS121B 053", costoPDF: 37.50, valorComercial: 130.00 },
  { codigoInche: "BVSTDCS51B 053", costoPDF: 25.50, valorComercial: 80.00 },
  { codigoInche: "BVSTDCS51R 053", costoPDF: 25.50, valorComercial: 80.00 },
  { codigoInche: "BVSTDCDR5B 053", costoPDF: 25.50, valorComercial: 85.00 },
  { codigoInche: "BVSTDCDR5R 053", costoPDF: 25.50, valorComercial: 85.00 },
  { codigoInche: "BVSTBMH23 053", costoPDF: 50.00, valorComercial: 170.00 },
  { codigoInche: "BVSTKT8990 053", costoPDF: 50.00, valorComercial: 170.00 },
  { codigoInche: "BVSTKT35W 053", costoPDF: 36.50, valorComercial: 120.00 },
  { codigoInche: "BVSTKT673CR 053", costoPDF: 30.00, valorComercial: 80.00 },
  { codigoInche: "BVSTKT673SS 053", costoPDF: 30.00, valorComercial: 90.00 },
  { codigoInche: "BVSTKED889R 053", costoPDF: 27.00, valorComercial: 93.00 },
  { codigoInche: "BVSTKT4177M 053", costoPDF: 24.00, valorComercial: 70.00 },
  { codigoInche: "BVSTKT4177V 053", costoPDF: 24.00, valorComercial: 75.00 },
  { codigoInche: "BVSTKT4177K 053", costoPDF: 22.50, valorComercial: 70.00 },
  { codigoInche: "BVSTKT4177W 053", costoPDF: 22.50, valorComercial: 70.00 },
  { codigoInche: "BVSTKT4177R 053", costoPDF: 22.50, valorComercial: 70.00 },
  { codigoInche: "BVSTKT3101 053", costoPDF: 15.50, valorComercial: 55.00 },
  { codigoInche: "GCSTGS7050 053", costoPDF: 99.00, valorComercial: 330.00 },
  { codigoInche: "GCSTPX9000B 053", costoPDF: 51.00, valorComercial: 170.00 },
  { codigoInche: "GCSTCC 5000 053", costoPDF: 40.00, valorComercial: 130.00 },
  { codigoInche: "GCSTAC6953 053", costoPDF: 38.00, valorComercial: 110.00 },
  { codigoInche: "GCSTAC6901 053", costoPDF: 32.50, valorComercial: 100.00 },
  { codigoInche: "GCSTBS6052 053", costoPDF: 26.00, valorComercial: 85.00 },
  { codigoInche: "GCSTBS6051 053", costoPDF: 26.00, valorComercial: 85.00 },
  { codigoInche: "GCSTBV 4119 053", costoPDF: 24.00, valorComercial: 70.00 },
  { codigoInche: "GCSTBS6003 053", costoPDF: 22.00, valorComercial: 65.00 },
  { codigoInche: "GCSTBS5001 053", costoPDF: 20.00, valorComercial: 65.00 },
  { codigoInche: "GCSTBS5004 053", costoPDF: 19.00, valorComercial: 50.00 },
  { codigoInche: "TSSTTV25FDMAFNS 053", costoPDF: 106.50, valorComercial: 350.00 },
  { codigoInche: "TSSTTV35FDMAFNS 053", costoPDF: 129.50, valorComercial: 420.00 },
  { codigoInche: "TSSTTV42FDDAFNS 053", costoPDF: 180.50, valorComercial: 600.00 },
  { codigoInche: "GCSTBS3802 053", costoPDF: 15.00, valorComercial: 45.00 },
  { codigoInche: "GCSTFS 300 053", costoPDF: 50.00, valorComercial: 170.00 },
  { codigoInche: "GCSTES 101 053", costoPDF: 34.00, valorComercial: 115.00 },
  { codigoInche: "CKSTRC12DFBLK 053", costoPDF: 54.00, valorComercial: 180.00 },
  { codigoInche: "BVSTDC551R 053", costoPDF: 25.50, valorComercial: 75.00 },
  { codigoInche: "BVSTBMH24 053", costoPDF: 52.50, valorComercial: 180.00 },
  
  // 🔥 AQUÍ ESTÁN TUS 4 MODELOS ACTUALIZADOS EXACTOS AL FINAL DEL EXCEL 🔥
  { codigoInche: "BLSTKAG KPB 053", costoPDF: 45.00, valorComercial: 160.00 },
  { codigoInche: "BLSTKAG RPB 053", costoPDF: 45.00, valorComercial: 160.00 },
  { codigoInche: "BLSTKAG BPB 053", costoPDF: 45.00, valorComercial: 160.00 },
  { codigoInche: "BLSTKAG VPB 053", costoPDF: 45.00, valorComercial: 160.00 },
  
  { codigoInche: "CKSTPCECT75DF 053", costoPDF: 135.00, valorComercial: 450.00 }
];

async function main() {
  console.log("🔥 [SEED] Vaciando base de datos K.O. actual...");
  await prisma.dataKO.deleteMany();
  
  // 🧠 CEREBRO ANTI-DUPLICADOS: Filtramos en código quedándonos con el último registro encontrado.
  const mapaUnicos = new Map();
  datosCrudos.forEach(item => {
     mapaUnicos.set(item.codigoInche, item);
  });
  
  // Convertimos de vuelta a un arreglo limpio y listo para enviar
  const datosIncheLimpios = Array.from(mapaUnicos.values());

  console.log(`🚀 [SEED] Inyectando ${datosIncheLimpios.length} códigos Inche únicos y definitivos...`);
  
  const resultado = await prisma.dataKO.createMany({
    data: datosIncheLimpios.map(d => ({
      ...d,
      costoSoles: 0 // El sistema los calculará dinámicamente en la interfaz
    })),
    skipDuplicates: true, 
  });

  console.log(`✅ [SEED] Éxito rotundo. Se inyectaron ${resultado.count} registros perfectos sin fallas en la base de datos.`);
}

main()
  .catch(e => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });