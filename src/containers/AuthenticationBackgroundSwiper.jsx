import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/autoplay';

const AuthenticationBackgroundSwiper = () => {
    function imgUrl() {
        const id = Math.floor(Math.random() * (200 - 1 + 1) + 1);
        return `https://picsum.photos/id/${id}/1920/1080`;
    }

    return (
        <div className='absolute inset-0 z-0'>
            <Swiper modules={[Autoplay]} slidesPerView={1} autoplay={{ delay: 5000 }} className='h-full'>
                {Array.from({ length: 5 }).map((_, index) => (
                    <SwiperSlide key={index}>
                        <img src={imgUrl()} alt={`Slide ${index + 1}`} className='w-full h-full object-cover' />
                    </SwiperSlide>
                ))}
            </Swiper>
            {/* Blur effect and dark overlay */}
            <div className='absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm'></div>
        </div>
    );
};

export default AuthenticationBackgroundSwiper;
