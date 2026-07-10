import bgLogo from '../../assets/project_details/bgProject_details.png'
import logo from '../../assets/logo.png'

export default function TopLogo(){
    return(<>
     <div
        className="relative w-[15px] h-[110px] bg-contain
           bg-no-repeat bg-center flex items-center justify-center drop-shadow-xl"
        style={{ backgroundImage: `url(${bgLogo})` }}
      >
        <img
          src={logo}
          alt="Company Logo"
          className="w-[60px] h-[60px] object-contain"
        />
      </div>
    
    </>)
}