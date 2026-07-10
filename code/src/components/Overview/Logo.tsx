
import logo from '../../../public/logo.png'
export default function Logo() {
    return (<>
        <div className="bg-white absolute animate-drawer-down
                            right-[80px] top-0 px-3 py-2 md:px-7 md:py-5 shadow-md rounded-bl-[35px] rounded-br-[35px]">
            <img
                src={logo}
                alt="Logo"
                className="h-10 md:h-20 w-auto object-contain"
            />
        </div>

    </>)
}