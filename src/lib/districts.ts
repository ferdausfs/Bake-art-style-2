// বাংলাদেশের ৬৪টি জেলা — বিভাগ অনুযায়ী সাজানো
export interface District {
  id: string;
  name: string;      // Bengali name
  nameEn: string;    // English name
  division: string;  // বিভাগ
}

export const BANGLADESH_DISTRICTS: District[] = [
  // ঢাকা বিভাগ
  { id: "dhaka", name: "ঢাকা", nameEn: "Dhaka", division: "ঢাকা" },
  { id: "gazipur", name: "গাজীপুর", nameEn: "Gazipur", division: "ঢাকা" },
  { id: "narsingdi", name: "নরসিংদী", nameEn: "Narsingdi", division: "ঢাকা" },
  { id: "manikganj", name: "মানিকগঞ্জ", nameEn: "Manikganj", division: "ঢাকা" },
  { id: "munshiganj", name: "মুন্সিগঞ্জ", nameEn: "Munshiganj", division: "ঢাকা" },
  { id: "narayanganj", name: "নারায়ণগঞ্জ", nameEn: "Narayanganj", division: "ঢাকা" },
  { id: "tangail", name: "টাঙ্গাইল", nameEn: "Tangail", division: "ঢাকা" },
  { id: "kishoreganj", name: "কিশোরগঞ্জ", nameEn: "Kishoreganj", division: "ঢাকা" },
  { id: "mymensingh", name: "ময়মনসিংহ", nameEn: "Mymensingh", division: "ঢাকা" },
  { id: "netrokona", name: "নেত্রকোণা", nameEn: "Netrokona", division: "ঢাকা" },
  { id: "jamalpur", name: "জামালপুর", nameEn: "Jamalpur", division: "ঢাকা" },
  { id: "sherpur", name: "শেরপুর", nameEn: "Sherpur", division: "ঢাকা" },
  { id: "faridpur", name: "ফরিদপুর", nameEn: "Faridpur", division: "ঢাকা" },
  { id: "madaripur", name: "মাদারীপুর", nameEn: "Madaripur", division: "ঢাকা" },
  { id: "rajbari", name: "রাজবাড়ী", nameEn: "Rajbari", division: "ঢাকা" },
  { id: "shariatpur", name: "শরীয়তপুর", nameEn: "Shariatpur", division: "ঢাকা" },
  { id: "gopalganj", name: "গোপালগঞ্জ", nameEn: "Gopalganj", division: "ঢাকা" },

  // চট্টগ্রাম বিভাগ
  { id: "chittagong", name: "চট্টগ্রাম", nameEn: "Chittagong", division: "চট্টগ্রাম" },
  { id: "comilla", name: "কুমিল্লা", nameEn: "Comilla", division: "চট্টগ্রাম" },
  { id: "feni", name: "ফেনী", nameEn: "Feni", division: "চট্টগ্রাম" },
  { id: "brahmanbaria", name: "ব্রাহ্মণবাড়িয়া", nameEn: "Brahmanbaria", division: "চট্টগ্রাম" },
  { id: "rangamati", name: "রাঙ্গামাটি", nameEn: "Rangamati", division: "চট্টগ্রাম" },
  { id: "noakhali", name: "নোয়াখালী", nameEn: "Noakhali", division: "চট্টগ্রাম" },
  { id: "chandpur", name: "চাঁদপুর", nameEn: "Chandpur", division: "চট্টগ্রাম" },
  { id: "lakshmipur", name: "লক্ষ্মীপুর", nameEn: "Lakshmipur", division: "চট্টগ্রাম" },
  { id: "coxsbazar", name: "কক্সবাজার", nameEn: "Coxs Bazar", division: "চট্টগ্রাম" },
  { id: "khagrachhari", name: "খাগড়াছড়ি", nameEn: "Khagrachhari", division: "চট্টগ্রাম" },
  { id: "bandarban", name: "বান্দরবান", nameEn: "Bandarban", division: "চট্টগ্রাম" },

  // রাজশাহী বিভাগ
  { id: "rajshahi", name: "রাজশাহী", nameEn: "Rajshahi", division: "রাজশাহী" },
  { id: "chapainawabganj", name: "চাঁপাইনবাবগঞ্জ", nameEn: "Chapai Nawabganj", division: "রাজশাহী" },
  { id: "natore", name: "নাটোর", nameEn: "Natore", division: "রাজশাহী" },
  { id: "naogaon", name: "নওগাঁ", nameEn: "Naogaon", division: "রাজশাহী" },
  { id: "bogura", name: "বগুড়া", nameEn: "Bogura", division: "রাজশাহী" },
  { id: "joypurhat", name: "জয়পুরহাট", nameEn: "Joypurhat", division: "রাজশাহী" },
  { id: "sirajganj", name: "সিরাজগঞ্জ", nameEn: "Sirajganj", division: "রাজশাহী" },
  { id: "pabna", name: "পাবনা", nameEn: "Pabna", division: "রাজশাহী" },

  // খুলনা বিভাগ
  { id: "khulna", name: "খুলনা", nameEn: "Khulna", division: "খুলনা" },
  { id: "bagerhat", name: "বাগেরহাট", nameEn: "Bagerhat", division: "খুলনা" },
  { id: "satkhira", name: "সাতক্ষীরা", nameEn: "Satkhira", division: "খুলনা" },
  { id: "jessore", name: "যশোর", nameEn: "Jessore", division: "খুলনা" },
  { id: "narail", name: "নড়াইল", nameEn: "Narail", division: "খুলনা" },
  { id: "magura", name: "মাগুরা", nameEn: "Magura", division: "খুলনা" },
  { id: "jhenaidah", name: "ঝিনাইদহ", nameEn: "Jhenaidah", division: "খুলনা" },
  { id: "kushtia", name: "কুষ্টিয়া", nameEn: "Kushtia", division: "খুলনা" },
  { id: "meherpur", name: "মেহেরপুর", nameEn: "Meherpur", division: "খুলনা" },
  { id: "chuadanga", name: "চুয়াডাঙ্গা", nameEn: "Chuadanga", division: "খুলনা" },

  // বরিশাল বিভাগ
  { id: "barisal", name: "বরিশাল", nameEn: "Barisal", division: "বরিশাল" },
  { id: "bhola", name: "ভোলা", nameEn: "Bhola", division: "বরিশাল" },
  { id: "patuakhali", name: "পটুয়াখালী", nameEn: "Patuakhali", division: "বরিশাল" },
  { id: "barguna", name: "বরগুনা", nameEn: "Barguna", division: "বরিশাল" },
  { id: "pirojpur", name: "পিরোজপুর", nameEn: "Pirojpur", division: "বরিশাল" },
  { id: "jhalokati", name: "ঝালকাঠি", nameEn: "Jhalokati", division: "বরিশাল" },

  // সিলেট বিভাগ
  { id: "sylhet", name: "সিলেট", nameEn: "Sylhet", division: "সিলেট" },
  { id: "moulvibazar", name: "মৌলভীবাজার", nameEn: "Moulvibazar", division: "সিলেট" },
  { id: "habiganj", name: "হবিগঞ্জ", nameEn: "Habiganj", division: "সিলেট" },
  { id: "sunamganj", name: "সুনামগঞ্জ", nameEn: "Sunamganj", division: "সিলেট" },

  // রংপুর বিভাগ
  { id: "rangpur", name: "রংপুর", nameEn: "Rangpur", division: "রংপুর" },
  { id: "gaibandha", name: "গাইবান্ধা", nameEn: "Gaibandha", division: "রংপুর" },
  { id: "kurigram", name: "কুড়িগ্রাম", nameEn: "Kurigram", division: "রংপুর" },
  { id: "lalmonirhat", name: "লালমনিরহাট", nameEn: "Lalmonirhat", division: "রংপুর" },
  { id: "nilphamari", name: "নীলফামারী", nameEn: "Nilphamari", division: "রংপুর" },
  { id: "panchagarh", name: "পঞ্চগড়", nameEn: "Panchagarh", division: "রংপুর" },
  { id: "thakurgaon", name: "ঠাকুরগাঁও", nameEn: "Thakurgaon", division: "রংপুর" },
  { id: "dinajpur", name: "দিনাজপুর", nameEn: "Dinajpur", division: "রংপুর" },
];

// Division-grouped for admin UI
export const DIVISIONS = [...new Set(BANGLADESH_DISTRICTS.map(d => d.division))];

export const getDistrictsByDivision = (division: string) =>
  BANGLADESH_DISTRICTS.filter(d => d.division === division);

export const findDistrict = (name: string) =>
  BANGLADESH_DISTRICTS.find(
    d => d.name === name || d.nameEn.toLowerCase() === name.toLowerCase()
  );
