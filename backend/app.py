import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from PIL import Image
import io

# .env dosyasındaki API anahtarını yükle
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY bulunamadı. Lütfen .env dosyasını kontrol edin.")

genai.configure(api_key=api_key)

# Flask uygulamasını başlat
app = Flask(__name__)

# Yapay zeka modelini ayarla (Gemini Pro Vision)
# vision modeli (görme yeteneği olan)
model = genai.GenerativeModel('gemini-pro-vision')

# Gemini'ye göndereceğimiz komut (prompt)
# Bu kısım çok önemli. AI'dan ne istediğimizi net bir şekilde anlatıyoruz.
YIYECEK_PROMPTU = """
Bu fotoğraftaki yiyecekleri analiz et.
Tanıdığın her yiyecek için, adını, tahmini miktarını (gram veya adet olarak) ve tahmini kalorisini ver.
Sonucu bana bir JSON listesi formatında döndür. Sadece JSON kodunu ver, başka hiçbir metin veya açıklama ekleme.
Emin değilsen "tahmin edilemedi" yazabilirsin.

JSON formatı şu şekilde olsun:
[
  {"yiyecek": "Izgara Tavuk", "miktar": "150g", "kalori": 250},
  {"yiyecek": "Pilav", "miktar": "1 kase", "kalori": 200}
]
"""

@app.route('/analyze', methods=['POST'])
def analyze_image():
    # Mobil uygulamadan 'image' adında bir dosya bekliyoruz
    if 'image' not in request.files:
        return jsonify({"error": "Resim dosyası bulunamadı"}), 400

    file = request.files['image']

    try:
        # Gelen dosyayı bir resim olarak aç
        img = Image.open(file.stream)

        # Resmi Gemini'ye gönder
        # model.generate_content hem metin (prompt) hem de resim (img) alabilir
        response = model.generate_content([YIYECEK_PROMPTU, img])

        # Gemini'den gelen yanıtın içindeki JSON kısmını temizleyip alıyoruz
        # Bazen AI, JSON'u ```json ... ``` gibi bloklar içine alabilir, onu temizliyoruz.
        json_text = response.text.strip().replace("```json\n", "").replace("\n```", "")
        
        print("--- Gemini'den Gelen Ham Yanıt ---")
        print(json_text)
        print("---------------------------------")

        # Gelen metni JSON olarak mobil uygulamaya geri gönder
        # (Normalde burada try-except ile json.loads yapmak daha güvenli)
        return json_text, 200, {'Content-Type': 'application/json'}

    except Exception as e:
        print(f"Hata oluştu: {e}")
        return jsonify({"error": f"Görüntü işlenirken hata oluştu: {str(e)}"}), 500

if __name__ == '__main__':
    # Sunucuyu başlatıyoruz. 
    # '0.0.0.0' ayarı, sunucunun ağdaki diğer cihazlar (telefonunuz) tarafından erişilebilir olmasını sağlar.
    app.run(debug=True, host='0.0.0.0', port=5000)