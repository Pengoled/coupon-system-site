import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Company } from "../../../Models/Company";
import { ResponseDto } from "../../../Models/dto/ResponseDto";
import { companiesUpdatedAction } from "../../../Redux/CompaniesAppState";
import store from "../../../Redux/Store";
import globals from "../../../Services/Globals";
import tokenAxios from "../../../Services/InterceptorAxios";
import notify, { ErrMsg } from "../../../Services/Notification";
import EmptyView from "../../SharedArea/EmptyView/EmptyView";
import GoMenu from "../../SharedArea/GoMenu/GoMenu";
import "./UpdateCompany.css";

function UpdateCompany(): JSX.Element {

    const { id } = useParams();
    const navigate = useNavigate();

    const location = useLocation();
    const stateArr = location.state as Company[];
    const company = stateArr && stateArr[0];

    useEffect(() => {
        if (!store.getState().authState?.user) {
            notify.error(ErrMsg.PLS_LOGIN);
            navigate('/login');
            return;
        }

        if (store.getState().authState?.user?.clientType.toString() !== 'ADMIN') {
            notify.error(ErrMsg.UNAUTHORIZED);
            navigate('/');
            return;
        }
    })

    const schema = z.object({
        name: z.string(),
        email: z.string().nonempty("Please provide a valid email.").email('Invalid email.'),
        password: z.string().nonempty("Please choose a password.").min(5).max(15),
    })

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty, isValid },
    } = useForm<Company>({
        mode: "all",
        resolver: zodResolver(schema)
    });

    const sendToRemoteServer = async (company: Company) => {
        company.id = +id;
        tokenAxios.put<ResponseDto>(globals.urls.companies, company)
            .then(response => {
                if (response.data.success) {
                    console.log('good')
                    notify.success(response.data.message);
                    store.dispatch(companiesUpdatedAction(company));
                    navigate('/admin/company');
                }
            })
            .catch((err) => {
                switch (err.response?.status) {
                    case 401: // unauthorized
                        notify.error(ErrMsg.UNAUTHORIZED_OPERATION);
                        break;
                    case 403: // forbidden
                        notify.error(err.response.data);
                        break;
                    default:
                        notify.error(err);
                }
            })
    }

    return (
        <div className="UpdateCompany">

            {company !== null && <><h3 className="display-6">Update Company</h3>

                <form onSubmit={handleSubmit(sendToRemoteServer)} className="Form form-inline was-validated" noValidate>
                    <div className="form-group row">
                        <label className="col-4 col-form-label">Id</label>
                        <div className="col-8">
                            <div className="input-group">
                                <input {...register("id")} disabled type="text" className="form-control" defaultValue={id} />
                            </div>
                        </div>
                    </div>

                    <div className="form-group row">
                        <label className="col-4 col-form-label">Company Name</label>
                        <div className="col-8">
                            <div className="input-group">
                                <input {...register("name")} type="text" className="form-control" value={company?.name || ''} />
                                <div className="invalid-feedback"></div>
                                <span className="bad">{errors.name?.message}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group row">
                        <label className="col-4 col-form-label">Email</label>
                        <div className="col-8">
                            <div className="input-group">
                                <input {...register("email")} type="text" className="form-control" required defaultValue={company?.email} />
                                <div className="invalid-feedback"></div>
                            </div>
                            <div className="bad">{errors.email?.message}</div>
                        </div>
                    </div>


                    <div className="form-group row">
                        <label className="col-4 col-form-label">Password</label>
                        <div className="col-8">
                            <div className="input-group">
                                <input {...register("password")} type="password" className="form-control" required defaultValue={company?.password} />
                                <div className="invalid-feedback"></div>
                            </div>
                            <div className="bad">{errors.password?.message}</div>
                        </div>
                    </div>


                    <div className="form-group row">
                        <div className="btn-container">
                            <button disabled={!isValid} name="submit" type="submit" className="btn btn-primary">Update Company</button>
                        </div>
                    </div>
                </form>

                <GoMenu to='/admin/company' /></>
            }
            {!company && <><EmptyView message='Ooops.. company does not exist!' />
                <Link to="/admin/company"><button type="button" className="btn btn-secondary btn-md back-btn">Back to companies menu</button></Link></>}

        </div>
    );
}

export default UpdateCompany;
