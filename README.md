# 🥗 AI Calorie Lens: Fotoğraftan Kalori Takip Asistanı

## 📖 Proje Hakkında
Günlük hayatta kalori takibi yaparken her yiyeceği tek tek girmek kullanıcılar için yorucu olabiliyor. **AI Calorie Lens**, bu süreci otomatize etmek için geliştirildi. 

Kullanıcı tabağının fotoğrafını çeker, yapay zeka (Computer Vision) görseldeki besinleri tanır ve porsiyon analizi yaparak toplam kalori ve makro değerlerini (Protein, Karbonhidrat, Yağ) hesaplar.

**Temel Özellik:** "Yediğini yazma, fotoğrafını çek."

## ✨ Özellikler
* 📸 **Görsel Tanıma:** Tabağınızdaki yiyecekleri (örn: Izgara tavuk, pilav, salata) otomatik algılar.
* 📊 **Besin Analizi:** Algılanan yiyeceklerin yaklaşık kalori ve besin değerlerini hesaplar.
* 🤖 **AI Entegrasyonu:** [Buraya kullandığın modeli yaz, örn:Google Gemini API kullanılarak yüksek doğrulukta analiz yapar.

## 🛠 Kullanılan Teknolojiler
* **Dil:** Python
* **Yapay Zeka API:** [Gemini API vb.]
* **Veri İşleme:** Pandas, NumPy
* **Arayüz (Opsiyonel):** 

## 🚀 Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için:

1. **Depoyu klonlayın:**
   ```bash
   git clone [https://github.com/KULLANICI_ADIN/REPO_ADIN.git](https://github.com/KULLANICI_ADIN/REPO_ADIN.git)
   cd REPO_ADIN
   Gerekli kütüphaneleri yükleyin:

Bash

pip install -r requirements.txt
API Anahtarını Ayarlayın:

Ana dizinde .env adında bir dosya oluşturun.

İçine kendi API anahtarınızı ekleyin:

API_KEY=senin_api_anahtarin_buraya
Uygulamayı Başlatın:

Bash

python main.py
