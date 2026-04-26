// ═══════════════════════════════════════════════════════════════
//  streams.js — Caltrans D3 CCTV feeds
//  Source: https://cwwp2.dot.ca.gov/data/d3/cctv/cctvStatusD03.csv
//  Filtered: longitude between -120.68 and -120.02 (inclusive)
//  Sorted:   by longitude (west → east)
// ═══════════════════════════════════════════════════════════════

const STREAMS = [
  {
    name:      "Snow_ED50_EB_1",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Snows_Rd_ED50_EB_1.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/snowed50eb1/snowed50eb1.jpg",
    longitude: -120.67619,
    latitude:  38.734511,
    nearby:    "Camino",
    route:     "US-50"
  },
  {
    name:      "Snow_ED50_EB_2",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Snows_Rd_ED50_EB_2.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/snowed50eb2/snowed50eb2.jpg",
    longitude: -120.67619,
    latitude:  38.734511,
    nearby:    "Camino",
    route:     "US-50"
  },
  {
    name:      "Sly_Park_ED50_EB_1",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Sly_Park_ED50_EB_1.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/slyparked50eb1/slyparked50eb1.jpg",
    longitude: -120.591929,
    latitude:  38.756014,
    nearby:    "Pollock Pines",
    route:     "US-50"
  },
  {
    name:      "Sly_Park_ED50_EB_2",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Sly_Park_ED50_EB_2.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/slyparked50eb2/slyparked50eb2.jpg",
    longitude: -120.591929,
    latitude:  38.756014,
    nearby:    "Pollock Pines",
    route:     "US-50"
  },
  {
    name:      "Hwy 50 at Riverton Sandhouse",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Riverton_Sandhouse_ED50_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50atrivertonsandhouse/hwy50atrivertonsandhouse.jpg",
    longitude: -120.47105,
    latitude:  38.77383,
    nearby:    "Pollock Pines",
    route:     "US-50"
  },
  {
    name:      "Hwy 80 at Kingvale EB 2",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Kingvale_PLA80_EB_2.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atkingvaleeb2/hwy80atkingvaleeb2.jpg",
    longitude: -120.449498,
    latitude:  39.313528,
    nearby:    "Soda Springs",
    route:     "I-80"
  },
  {
    name:      "Hwy 80 at Kingvale EB 1",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Kingvale_PLA80_EB_1.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atkingvaleeb1/hwy80atkingvaleeb1.jpg",
    longitude: -120.449498,
    latitude:  39.313528,
    nearby:    "Soda Springs",
    route:     "I-80"
  },
  {
    name:      "Hwy 50 at Ice House",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Ice_House_Rd_JEO_ED50_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50aticehouse/hwy50aticehouse.jpg",
    longitude: -120.446648,
    latitude:  38.768721,
    nearby:    "Pollock Pines",
    route:     "US-50"
  },
  {
    name:      "Hwy 80 at Kingvale WB",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Kingvale_PLA80_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atkingvalewb/hwy80atkingvalewb.jpg",
    longitude: -120.439405,
    latitude:  39.31582,
    nearby:    "Soda Springs",
    route:     "I-80"
  },
  {
    name:      "Hwy 80 at Soda Springs EB",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Soda_Springs_NEV80_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atsodaspringseb/hwy80atsodaspringseb.jpg",
    longitude: -120.389657,
    latitude:  39.326506,
    nearby:    "Soda Springs",
    route:     "I-80"
  },
  {
    name:      "Hwy 80 at Castle Peak",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Castle_Peak_NEV80_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atcastlepeak/hwy80atcastlepeak.jpg",
    longitude: -120.355626,
    latitude:  39.334602,
    nearby:    "Soda Springs",
    route:     "I-80"
  },
  {
    name:      "Hwy 80 at Donner Lake",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Donner_Lake_Rd_JEO_NEV80_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atdonnerlake/hwy80atdonnerlake.jpg",
    longitude: -120.285422,
    latitude:  39.33075,
    nearby:    "Truckee",
    route:     "I-80"
  },
  {
    name:      "Hwy 80 at Old Ag Sta",
    url:       "https://wzmedia.dot.ca.gov/D3/80_AG_Station_NEV80_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atoldagsta/hwy80atoldagsta.jpg",
    longitude: -120.219099,
    latitude:  39.323597,
    nearby:    "Truckee",
    route:     "I-80"
  },
  {
    name:      "Hwy 50 at Wrights Lake 2",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Wrights_Lake_ED50_EB_2.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50atwrightslake2/hwy50atwrightslake2.jpg",
    longitude: -120.21115385298197,
    latitude:  38.78629612075367,
    nearby:    "Kyburz",
    route:     "US-50"
  },
  {
    name:      "Hwy 50 at Wrights Lake 1",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Wrights_Lake_ED50_EB_1.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50atwrightslake1/hwy50atwrightslake1.jpg",
    longitude: -120.210437,
    latitude:  38.786496,
    nearby:    "Twin Bridges",
    route:     "US-50"
  },
  {
    name:      "Hwy 80 at Hwy 89",
    url:       "https://wzmedia.dot.ca.gov/D3/80_JCT89S_NEV80_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80athwy89/hwy80athwy89.jpg",
    longitude: -120.207395,
    latitude:  39.322884,
    nearby:    "Truckee",
    route:     "I-80"
  },
  {
    name:      "Hwy 89 at West River",
    url:       "https://wzmedia.dot.ca.gov/D3/89_West_River_St_PLA89_NB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atwestriver/hwy89atwestriver.jpg",
    longitude: -120.204003,
    latitude:  39.314744,
    nearby:    "Truckee",
    route:     "SR-89"
  },
  {
    name:      "Hwy 89 at Olympic Valley",
    url:       "https://wzmedia.dot.ca.gov/D3/89_Olympic_Valley_Rd_PLA89_NB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atolympicvalley/hwy89atolympicvalley.jpg",
    longitude: -120.199202,
    latitude:  39.204709,
    nearby:    "Olympic Valley",
    route:     "SR-89"
  },
  {
    name:      "Hwy 89 at Alpine Meadows",
    url:       "https://wzmedia.dot.ca.gov/D3/89_Alpine_Meadows_PLA89_NB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atalpinemeadows/hwy89atalpinemeadows.jpg",
    longitude: -120.19489,
    latitude:  39.18724,
    nearby:    "Tahoe City",
    route:     "SR-89"
  },
  {
    name:      "Hwy 89 at Rampart",
    url:       "https://wzmedia.dot.ca.gov/D3/89_rampart.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atrampart/hwy89atrampart.jpg",
    longitude: -120.177562,
    latitude:  39.165377,
    nearby:    "Olympic Valley",
    route:     "SR-89"
  },
  {
    name:      "Hwy 80 at 267",
    url:       "https://wzmedia.dot.ca.gov/D3/80_JCT267_NEV80_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80at267/hwy80at267.jpg",
    longitude: -120.16833,
    latitude:  39.33791,
    nearby:    "Truckee",
    route:     "I-80"
  },
  {
    name:      "Hwy 267 at Truckee Bypass",
    url:       "https://wzmedia.dot.ca.gov/D3/267_Truckee_Bypass_NEV267_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy267attruckeebypass/hwy267attruckeebypass.jpg",
    longitude: -120.16323,
    latitude:  39.33429,
    nearby:    "Truckee",
    route:     "SR-267"
  },
  {
    name:      "Hwy 89 at Fairway Dr",
    url:       "https://wzmedia.dot.ca.gov/D3/89_Fairway_Dr_JWO_PLA89_NB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atfairwaydr/hwy89atfairwaydr.jpg",
    longitude: -120.1498,
    latitude:  39.164,
    nearby:    "Tahoe City",
    route:     "SR-89"
  },
  {
    name:      "Hwy 89 at Hwy 28",
    url:       "https://wzmedia.dot.ca.gov/D3/89_JCT28_PLA89_NB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89athwy28/hwy89athwy28.jpg",
    longitude: -120.14546,
    latitude:  39.16774,
    nearby:    "Tahoe City",
    route:     "SR-89"
  },
  {
    name:      "Hwy 89 at Granlibakken",
    url:       "https://wzmedia.dot.ca.gov/D3/89_Granlibakken_Rd_JNO_PLA89_NB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atgranlibakken/hwy89atgranlibakken.jpg",
    longitude: -120.1447,
    latitude:  39.1617,
    nearby:    "Tahoe City",
    route:     "SR-89"
  },
  {
    name:      "Hwy 80 at Truckee Scales",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Truckee_Scales_NEV80_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80attruckeescales/hwy80attruckeescales.jpg",
    longitude: -120.130051,
    latitude:  39.362234,
    nearby:    "Truckee",
    route:     "I-80"
  },
  {
    name:      "Hwy 80 at Truckee Scales WB",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Truckee_Scales_JEO_NEV80_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80attruckeescaleswb/hwy80attruckeescaleswb.jpg",
    longitude: -120.12443,
    latitude:  39.36354,
    nearby:    "Truckee",
    route:     "I-80"
  },
  {
    name:      "Hwy 50 at Twin Bridges",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Twin_bridges_ED50_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50attwinbridges/hwy50attwinbridges.jpg",
    longitude: -120.124303,
    latitude:  38.811193,
    nearby:    "Twin Bridges",
    route:     "US-50"
  },
  {
    name:      "Hwy 267 at Northstar",
    url:       "https://wzmedia.dot.ca.gov/D3/267_Northstar_PLA267_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy267atnorthstar/hwy267atnorthstar.jpg",
    longitude: -120.103798,
    latitude:  39.287024,
    nearby:    "Northstar",
    route:     "SR-267"
  },
  {
    name:      "Hwy 28 at Dollar",
    url:       "https://wzmedia.dot.ca.gov/D3/28_Dollar_Point_PLA28_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy28atdollar/hwy28atdollar.jpg",
    longitude: -120.10347,
    latitude:  39.19375,
    nearby:    "Tahoe City",
    route:     "SR-28"
  },
  {
    name:      "Hwy 50 at Sierra EB",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Sierra_at_Tahoe_Rd_ED50_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50atsierraeb/hwy50atsierraeb.jpg",
    longitude: -120.07592,
    latitude:  38.81914,
    nearby:    "Echo Lake",
    route:     "US-50"
  },
  {
    name:      "Hwy 267 at Brockway Summit",
    url:       "https://wzmedia.dot.ca.gov/D3/267_Brockway_Summit_PLA267_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy267atbrockwaysummit/hwy267atbrockwaysummit.jpg",
    longitude: -120.071841,
    latitude:  39.26079,
    nearby:    "Tahoe Vista",
    route:     "SR-267"
  },
  {
    name:      "Hwy 28 at Hwy 267 Kings Beach",
    url:       "https://wzmedia.dot.ca.gov/D3/28_JCT267_JWO_KINGS_BEACH_PLA28_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy28athwy267kingsbeach/hwy28athwy267kingsbeach.jpg",
    longitude: -120.03157,
    latitude:  39.237831,
    nearby:    "Kings Beach",
    route:     "SR-28"
  },
  {
    name:      "Hwy 50 at Echo Summit",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Echo_Summit_ED50_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50atechosummit/hwy50atechosummit.jpg",
    longitude: -120.02928,
    latitude:  38.81321,
    nearby:    "South Lake Tahoe",
    route:     "US-50"
  },
  {
    name:      "Hwy 80 at Floriston",
    url:       "https://wzmedia.dot.ca.gov/D3/80_Floriston_Way_NEV80_EB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy80atfloriston/hwy80atfloriston.jpg",
    longitude: -120.023839,
    latitude:  39.395554,
    nearby:    "Truckee",
    route:     "I-80"
  },
  {
    name:      "Hwy 50 at Meyers",
    url:       "https://wzmedia.dot.ca.gov/D3/50_Meyers_ED50_WB.stream/playlist.m3u8",
    preview:   "https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy50atmeyers/hwy50atmeyers.jpg",
    longitude: -120.022959,
    latitude:  38.850899,
    nearby:    "Meyers",
    route:     "US-50"
  }
];
