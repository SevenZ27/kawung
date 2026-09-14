import type { MotifId } from '../params'
import type { MotifDef } from '../types'
import { ceplok } from './ceplok'
import { kawung } from './kawung'
import { parang } from './parang'
import { truntum } from './truntum'

export const MOTIFS: Record<MotifId, MotifDef> = { kawung, parang, truntum, ceplok }

export interface MotifInfo {
  name: string
  // short paraphrase of a checked source, null when no source was found
  note: string | null
  source: { label: string; url: string } | null
}

// Every note below was checked against the linked page on 13 Sep 2026.
export const MOTIF_INFO: Record<MotifId, MotifInfo> = {
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
