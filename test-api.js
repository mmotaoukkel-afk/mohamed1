const WOO_CONFIG = {
  baseURL: 'https://kataraa.com/wp-json/wc/v3',
  consumerKey: 'ck_9c64aa5537ea5b2c439fdd8e6928ddc30b4d88f2',
  consumerSecret: 'cs_709a363c9a045e61f717543c76221f00004bc9bb',
};

const auth = Buffer.from(`${WOO_CONFIG.consumerKey}:${WOO_CONFIG.consumerSecret}`).toString('base64');

fetch(`${WOO_CONFIG.baseURL}/products`, {
  headers: { Authorization: `Basic ${auth}` }
})
.then(res => res.json())
.then(data => {
  console.log('✅ API يخدم!');
  console.log(`عدد المنتجات: ${data.length}`);
  if(data[0]) console.log(`أول منتج: ${data[0].name}`);
})
.catch(err => console.log('❌ خطأ:', err.message));
