import type { MotifId } from '../params'
import type { MotifDef } from '../types'
import { ceplok } from './ceplok'
import { kawung } from './kawung'
import { parang } from './parang'
import { truntum } from './truntum'
import { nitik, jlamprang, megamendung, tambal, gringsing, semen } from './collection'

export const MOTIFS: Record<MotifId, MotifDef> = { kawung, parang, truntum, ceplok, nitik, jlamprang, megamendung, tambal, gringsing, semen }

export interface MotifInfo {
  name: string
  // short paraphrase of a checked source, null when no source was found
  note: string | null
  source: { label: string; url: string } | null
}

// Sources and interpretation limits are recorded in docs/MOTIF-REFERENCES.md.
export const MOTIF_INFO: Record<MotifId, MotifInfo> = {
  nitik: {
    name: 'Nitik', note: 'Titik-titik persegi membentuk susunan geometris menyerupai tenunan. Versi terbaru memakai bunga berundak, garis titik belah ketupat, dan isian kecil di antaranya, terinspirasi tradisi Nitik di Bantul.',
    source: { label: 'Pemerintah Kabupaten Bantul', url: 'https://bantulkab.go.id/berita/detail/5828.html' },
  },
  jlamprang: {
    name: 'Jlamprang', note: 'Medalion geometris berulang dengan bunga di tengah, lingkaran, dan belah ketupat. Jlamprang dikenal dalam tradisi batik Pekalongan.',
    source: { label: 'Indonesia Travel', url: 'https://www.indonesia.travel/id/id/travel-ideas/heritage/menilik-makna-di-balik-mahakarya-7-motif-batik-di-indonesia' },
  },
  megamendung: {
    name: 'Megamendung', note: 'Awan memanjang dengan kontur lengkung berlapis, khas batik Cirebon. Versi terbaru memakai tujuh kontur, ujung meruncing, dan baris awan yang saling mengisi.',
    source: { label: 'Indonesia Travel', url: 'https://www.indonesia.travel/id/en/travel-ideas/culture/batik-motif-mega-mendung' },
  },
  tambal: {
    name: 'Tambal', note: 'Bidang-bidang geometris disusun seperti tambalan. Versi terbaru memadukan isian Kawung, pita lengkung, bunga, dan cecek di dalam bidang belah ketupat.',
    source: { label: 'Buku Limas, Kementerian Pendidikan', url: 'https://repositori.kemendikdasmen.go.id/25519/1/Buku%20Limas%20Edisi%20Juli%2040%20Revisi%204.pdf' },
  },
  gringsing: {
    name: 'Gringsing', note: 'Bulatan kecil yang bersinggungan membentuk susunan seperti sisik ikan. Ini interpretasi motif batik Gringsing, berbeda dari kain tenun geringsing Bali.',
    source: { label: 'Penelitian Gringsing Bantul', url: 'https://garuda.kemdiktisaintek.go.id/documents/detail/1869145' },
  },
  semen: {
    name: 'Semen', note: 'Ragam hias tumbuhan dan kehidupan alam. Interpretasi ini memilih sulur, daun berpasangan, dan bunga; tidak mewakili susunan khusus Semen Rama.',
    source: { label: 'Museum Sonobudoyo', url: 'https://sonobudoyo.jogjaprov.go.id/id/tulisan/read/mengenal-batik-khas-jogja-filosofi-di-balik-keindahan-motifnya' },
  },
  kawung: {
    name: 'Kawung',
    note: 'Empat bentuk elips yang mengelilingi satu pusat. Susunan ini dikenal sebagai keblat papat lima pancer, dan kawung termasuk batik larangan di Keraton Yogyakarta.',
    source: {
      label: 'Keraton Yogyakarta',
      url: 'https://www.kratonjogja.id/kagungan-dalem/12-motif-batik-larangan-keraton-yogyakarta/',
    },
  },
  parang: {
    name: 'Parang',
    note: 'Garis diagonal yang melengkung dan berulang. Keraton Yogyakarta mencatat aturan pemakaian parang sebagai batik larangan makin ketat di masa Sri Sultan Hamengku Buwono VIII.',
    source: {
      label: 'Keraton Yogyakarta',
      url: 'https://www.kratonjogja.id/kagungan-dalem/12-motif-batik-larangan-keraton-yogyakarta/',
    },
  },
  truntum: {
    name: 'Truntum',
    note: 'Menurut Museum Sonobudoyo, motif ini diciptakan Kanjeng Ratu Kencana, istri Sunan Paku Buwana III, dan menggambarkan cinta yang tulus.',
    source: {
      label: 'Museum Sonobudoyo',
      url: 'https://sonobudoyo.jogjaprov.go.id/id/tulisan/read/mengenal-batik-khas-jogja-filosofi-di-balik-keindahan-motifnya',
    },
  },
  ceplok: {
    name: 'Ceplok',
    note: 'Pola geometris yang simetris, dengan unsur seperti bunga atau bintang yang diulang.',
    source: {
      label: 'Museum Sonobudoyo',
      url: 'https://sonobudoyo.jogjaprov.go.id/id/tulisan/read/mengenal-batik-khas-jogja-filosofi-di-balik-keindahan-motifnya',
    },
  },
}
