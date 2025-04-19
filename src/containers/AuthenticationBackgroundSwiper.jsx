import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/autoplay';

// Import your images
import img1 from '../assets/pictures/1.png';
import img2 from '../assets/pictures/2.png';
import img3 from '../assets/pictures/3.png';
import img4 from '../assets/pictures/4.png';
import img5 from '../assets/pictures/5.png';

const AuthenticationBackgroundSwiper = () => {
    const images = [img1, img2, img3, img4, img5];

    return (
        <div className='absolute inset-0 z-0'>
            <Swiper
                modules={[Autoplay]}
                slidesPerView={1}
                autoplay={{ delay: 5000 }}
                loop={true}
                className='h-full'
            >
                {images.map((image, index) => (
                    <SwiperSlide key={index}>
                        <img src={image} alt={`Slide ${index + 1}`} className='w-full h-full object-cover' />
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Blur effect and dark overlay */}
            <div className='absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm'></div>
        </div>
    );
};

export default AuthenticationBackgroundSwiper;
